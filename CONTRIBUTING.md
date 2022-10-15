# Contributing Guidelines
The main branch is protected, so When starting work on a new feature, branch off from the ```main``` branch, create a new branch do the necessary edits.

## 1- Create a branch and add your edits:
```
git checkout -b my-new-branch
```

Create, edit, or delete files. The stage and commit them:
```sh
git add .
git commit -m "My commit message"
```
Push your branch to GitLab:

```sh
git push origin my-new-branch
```

## 2- Create your merge requests:

Then go to https://gitlab.aws.dev/osmarb/aws-ivs-manifest-clip

You can create a merge request from the list of merge requests.

1- On the top bar, select Main menu > Projects and find your project.
2- On the left menu, select Merge requests.
3- In the top right, select New merge request.
4- Select a source and target branch and then Compare branches and continue.
5- Fill out the fields and select the code reviewer


    Reviewers:
    Osmar Bento
    
    Security:
    Osmar Bento

6- Create your merge request
