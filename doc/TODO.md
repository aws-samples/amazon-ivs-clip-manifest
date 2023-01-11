### (1) Front Mock [x]
- [x] app backgroud
- [x] containers
    - [x] selector
    - [x] video
    - [x] clips
    - [x] debuger
- [x] desing
    - [x] mock data
    - [x] selector
### (1.1) Update the SAM template to create a cloudfront dist
- [x] update sam temple with CF https://izifortune.com/serverless-website-sam-aws/
    - [x] update env vars
    - [x] reference the env vars
    - [x] CF forward headers
    - [x] S3 Cors Policy
### (2) API get
#### (2.1) get recordings
- [x] lambda get recordings
    - [x] update sam package
    - [x] front get recordings
    - [x] call from Home to api module
    - [x] map each item
    - [x] onClick 
    - [x] onSelect
#### (2.2) get clips
- [x] lambda get clips
    - [x] update sam package
    - [x] front get recordings
    - [x] call from Home to api module
    - [x] map each item
    - [ ] filter the clips based on the recording ID
    - [ ] onClick
    - [ ] Play
### (4) manifestclip
- [x] lambda
- [x] sam
- [x] change clip to have an ID
- [x] change the playlist to have a version
- [x] change from Request to S3 https://stackoverflow.com/questions/30651502/how-to-get-contents-of-a-text-file-from-aws-s3-using-a-lambda-function#:~:text=You%20can%20use%20data.,encoding%20types%20to%20the%20function.
- [ ] front api
- [ ] time range selector
- [ ] call from home 
- [ ] onClick
### (5) Front place holders
- [ ] add place holders
### (5) Create the config file and import
- [ ] .env or .config
- [ ] import in each api

### (6) code review
- [ ] front
- [ ] lamb get recordings
- [ ] lamb get clips

### (6) Documentation
- [ ] front
- [ ] back

### (7) open sourcing process https://w.amazon.com/bin/view/Open_Source/Open_Sourcing/
- Ticket: https://t.corp.amazon.com/V766122117
- [ ] Create the repo in private

### (8) testing
[test doc](tests.md)
