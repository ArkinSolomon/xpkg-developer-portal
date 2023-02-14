# X-Pkg Package Registry

The registry is responsible for keeping track of authors and packages, as well as uploading new packages and versions. 

## Routes

### /packages

_Method:_ **GET**
_Authorization:_ **none**

Get all of the packages and versions on the registry. 

**Responses**

* Status: 200 OK
* Content-Type: application/json
* Sample response:
```json
{
  "data": [
    {
      "authorId": "w56kzm5dgy2eyxny",
      "authorName": "Arkin Solomon",
      "description": "ooga booga",
      "packageId": "arkin.test_package",
      "packageName": "Arkin Test Package",
      "packageType": "aircraft",
      "versions": [
        "1.0.0",
        "1.0.1",
        "1.0.2",
        "1.0.3",
        "1.0.4",
        "1.0.5"
      ]
    }
  ]
}
```

### /packages/:packageId/:version

_Method:_ **GET**
_Authorization:_ **none**

Get information on a specific version of a specific package

**Responses**

* Status: 200 OK
* Content-Type: application/json
* Sample response:
```json
{
  "dependencies": [
    [
      "arkin.dep2",
      "*"
    ],
    [
      "arkin.dep",
      "*"
    ]
  ],
  "hash": "9D5BE4AB4CD72FEF508B59CE0C530B0F293B63A894F7959F044A89F3E8400467",
  "incompatibilities": [],
  "loc": "https://xpkgregistrydev.s3.us-east-2.amazonaws.com/kGdUldPGyPjXMyzjPfqeBVnfwfAw1Z1s7LMgCiKqSRsdJpBuFOn7Ud0cQ3jq22aS",
  "optionalDependencies": []
}
```

### /packages/description

_Method:_ **PUT**
_Authorization:_ **required**

Overwrite the description.

Sample request (application/x-www-form-urlencoded):
```text
newDescription=new+description
packageId=arkin.test_package
```

**Responses**

* Status: 200 No Content
