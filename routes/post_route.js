const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PostModel = mongoose.model("PostModel");
const protectedRoute = require("../middleware/protectedResource");

//all users posts
router.get("/allposts", (req, res) => {
  PostModel.find()
    .populate("author", "_id fullName profileImg")
    .populate("comments.commentedBy", "_id fullName")
    .then((dbPosts) => {
      res.status(200).json({ posts: dbPosts });
    })
    .catch((error) => {
      console.log(error);
    });
});

//all posts only from logged in user
router.get("/myallposts", protectedRoute, (req, res) => {
  PostModel.find({ author: req.user._id })
    .populate("author", "_id fullName profileImg")
    .then((dbPosts) => {
      res.status(200).json({ posts: dbPosts });
    })
    .catch((error) => {
      console.log(error);
    });
});

router.post("/createpost", protectedRoute, (req, res) => {
  const { description, location, image } = req.body;
  if (!description || !location || !image) {
    return res
      .status(400)
      .json({ error: "One or more mandatory fields are empty" });
  }
  req.user.password = undefined;
  const postObj = new PostModel({
    description: description,
    location: location,
    image: image,
    author: req.user,
  });
  postObj
    .save()
    .then((newPost) => {
      res.status(201).json({ post: newPost });
    })
    .catch((error) => {
      console.log(error);
    });
});

router.delete("/deletepost/:postId", protectedRoute, (req, res) => {
  PostModel.findOne({ _id: req.params.postId })
    .populate("author", "_id")
    .then((postFound) => {
      if (!postFound) {
        return res.status(400).json({ error: "Post does not exist" });
      }
      // Check if the post author is the same as the logged-in user, only then allow deletion
      if (postFound.author._id.toString() === req.user._id.toString()) {
        postFound
          .deleteOne()
          .then((data) => {
            res.status(200).json({ result: data });
          })
          .catch((error) => {
            console.log(error);
            res.status(500).json({ error: "Internal Server Error" });
          });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

router.put("/like", protectedRoute, (req, res) => {
  PostModel.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { likes: req.user._id },
    },
    {
      new: true, // returns updated record
    }
  )
    .populate("author", "_id fullName")
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});

router.put("/unlike", protectedRoute, (req, res) => {
  PostModel.findByIdAndUpdate(
    req.body.postId,
    {
      $pull: { likes: req.user._id },
    },
    {
      new: true, // returns updated record
    }
  )
    .populate("author", "_id fullName")
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});

router.put("/comment", protectedRoute, (req, res) => {
  const comment = {
    commentText: req.body.commentText,
    commentedBy: req.user._id,
  };

  PostModel.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { comments: comment },
    },
    {
      new: true, // returns updated record
    }
  )
    .populate("comments.commentedBy", "_id fullName") // comment owner
    .populate("author", "_id fullName") // post owner
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});
module.exports = router;
