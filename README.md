### Problem statement:
Design an efficient in-memory queueing system with low latency requirements
`Functional specification`:
- Queue holds JSON messages
- Allow subscription of Consumers to messages that match a particular expression
- Consumers register callbacks that will be invoked whenever there is a new message
- Queue will have one producer and multiple consumers
- Consumers might have dependency relationships between them. For ex, if there are three consumers A, B and C. One dependency relationship can be that C cannot consume a particular message before A and B have consumed it. C -> (A,B) (-> means must process after)
- Queue is bounded in size and completely held in-memory. Size is configurable.
- Handle concurrent writes and reads consistently between producer and consumers.
- Provide retry mechanism to handle failures in message processing.

### Postman Collection
The postman collection is added in the git repository which has all the request saved in it and can be used to test the application.

### Technologies and the modules used:
* Technology: `Node.js` As the most of the operations in the application are `I/O`
* Web Framework: `Express.js`
* Database: `MongoDB` and `Redis` for the in-memory queue
* Validations: `Joi`
* Test: `Mocha, Chai, Sinon`
* ORM: `Mongoose`
* Authentication and Authorization: `JSON Web Token`

#### `Architecture`:
##### Note:
To perform the operations, Redis transactions `(multi/exec)` is used everywhere to acheive the consistency.
- When user subscribes to any topic the entry is created in the mongodb collection.
- And when a producer created a content, Check if the list has already reached the limit and if not Add it to the `Redis` list with name `messages` and publish an event `new message` using redis `pub/sub` model.
- Queue size can be configured from the `queue config`
- As soon as the message is received by the `Redis Subscriber`, It starts a `worker` which is responsible for the following things.
    - Get all the subscribers with the given topic.
    -  Add the message to the seperate list for every consumer. List name nome `consumer_userId`.
    -  check if there is a dependency for the consumers and if yes, add the entry to the `messageDependencyMap` and it has following structure.

```
                {
                    userId_messageId: {
                        dependency: { // it is the consumer on which the current consumer is depend on and the boolean value shows if the dependency is suttisfied or not.
                            dependee1_id: true/false,
                            dependee2_id: true/false
                        },
                        isLocked: false // when any worker picks up this message to publish to the consumer it acquires this lock so that no other worker should process the same message again.
                    }
                }
```

- -  Create the map of the dependee to the dependent which is used in the while resolving the dependency. It has the following structure.

```
                {
                    dependents: [dependees] // if a and b are dependend on c, then this will be c: [a, b] and is used when c is processed, resolve the dependency of the a and be in messageDependencyMap
                }
```

- -  Initialize the workers to process the message from the every consumers list. The number of workers can be configured from the queue config.

- Once the Workers have started, They start processing the lists int the `round-robin` fashion. This worker is responsible for the following things.
    1) Get all the consumers list and start processing the list one by one.
    2) Get the first element of the list and check if the lock is acquired on the element and if yes then move to the next list and perform the step 2 until it finds the free message.
    3) if the lock is not acquired on the message that means no worker is processing the message so check if there is any dependency present for that consumer and if yes then check if the dependency is resolved using `messageDependencyMap`. If the dependency is not resolved then move to the next list. and perform the step 2 and 3.
    4) If the dependency is resolved then acquire the lock.
    5) Add the expiry of the lock once the worker acquires the lock so that id worker dies in the middle the message should be freed. Catch this message once expired and add to the queue again.
    6) Start processing of the element i.e. send the message to the `callback_url`the consumer has provided. If it fails retry again. Number of the retries can be configured in queue config.
    7) When message is published to the cosumer successfully, remove the element from the consumers list as well as from the messageDependencyMap.
    8) If the publish fails then remove the element from the consumers list as well as from the messageDependencyMap. And add the message to the `dead letter queue` for the debugging purpose.

#### `Apis`:

##### `User Registration`:
This api is used to register the user as per the role.
```
Method: POST,
URL: /api/users/create,
Payload: {
	"name": "prem",
	"email":"prem@gmail.com",
	"password": "prem",
	"role": "user"
},
Response: {
    "success": true/false,
    "message": "message"
}
```

##### `Login`:
This api will be used to authenticate the user. And after successful login it returns the `jwt token` which we need to send in the subsequent request in the headers with key `authorization`.
```
Method: POST,
URL: /auth/local,
payload: {
	"email": "chougule.ds@gmail.com",
	"password": "deepak"
},
response: {
    "success": true,
    "message": "login success.",
    "token": "json web token"
}
```

##### `Subscribe`:
Using this api User can subscribe for the perticular topic.
```
Method: POST,
URL: /api/consumers/subscribe,
Payload: {
	"topic": "sql",
	"callback_url": "localhost:8000/consume" // callback url is called when producer produces a content with given topic
},
Headers: {
    "authorization": "jwt token"
},
Response: {
    "success": true,
    "message": "subscribed."
}
```

##### `Add Dependency`:
Using this api `Admin` can add adependency between different consumers.
```

Method: POST,
URL: /api/consumers/addDependency,
Payload: {
    "user":"5a23e921df7bc91bf04588ad", // user to which dependency being added
	"dependent_on":["5a23e92adf7bc91bf04588ae"] // dependent on
},
Headers: {
    "authorization": "jwt token"
},
Response: {
    "success": true,
    "message": "dependency added."
}
```
##### `Publish Content`:

This api will be used by the users to produce the content with the given topic
```
Method: POST,
URL: /api/producers/publish,
Payload: {
	"topic": "sql",
	"content": "mysql"
},
Headers: {
    "authorization": "jwt token"
},
Response: {
    "success": true,
    "message": "Published."
}
```

#### `Database Schema`:
#### User:
```
{
  name: String,
  email: String, // unique
  password: String,
  role: String, // possible values 'user', 'admin'
}
```
#### Consumer:
```
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    topic: String,
    callback_url: String,
    dependency: {
        // dependency is the array of the consumers on which current consumer is dependent
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User'
    }
}
```

#### Additional Points:
* Application is built using latest node version with `async/await`.
* Authentication and authorization are handled.
* Validations are properly handled.
* Test cases are written.
* Linting is used.
