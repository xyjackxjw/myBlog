const marked = require('marked')
const Comment = require('../lib/mongo').Comment

// 将 comment 的 content 从 markdown 转换成 html
// markdown 解析文章的内容，所以在发表文章的时候可使用 markdown 语法（如插入链接、图片等等）
Comment.plugin('contentToHtml', {
  afterFind: function (comments) {
    return comments.map(function (comment) {
      comment.content = marked(comment.content)
      return comment
    })
  }
})

module.exports = {
  // 创建一个留言
  create: function create (comment) {
    return Comment.create(comment).exec()
  },

  // 通过留言 id 获取一个留言
  getCommentById: function getCommentById (commentId) {
    return Comment.findOne({ _id: commentId }).exec()
  },

  // 通过留言 id 删除一个留言
  delCommentById: function delCommentById (commentId) {
    return Comment.remove({ _id: commentId }).exec()
  },

  // 通过文章 id 删除该文章下所有留言
  delCommentsByPostId: function delCommentsByPostId (postId) {
    return Comment.remove({ postId: postId }).exec()
  },

  // 通过文章 id 获取该文章下所有留言，按留言创建时间升序
  getComments: function getComments (postId) {
    return Comment
      .find({ postId: postId })
      .populate({ path: 'author', model: 'User' })
      .sort({ _id: 1 })
      .addCreatedAt()
      .contentToHtml()
      .exec()
  },

  // 通过文章 id 获取该文章下留言数
  getCommentsCount: function getCommentsCount (postId) {
    return Comment.count({ postId: postId }).exec()
  }
}
// 小提示：我们让留言也支持了 markdown。 注意：删除一篇文章成功后也要删除该文章下所有的评论，上面 delCommentsByPostId 就是用来做这件事的。

