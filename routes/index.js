// 总的路由文件，配置各路由的处理文件

module.exports = function (app) {
  app.get('/', function (req, res) {
    res.redirect('/posts') //查看文章，这里未登录也是可以查看的，然后在posts中给定了不同的权限
  })
  app.use('/signup', require('./signup'))
  app.use('/signin', require('./signin'))//交给同目录routes下的signin.js来处理登录的get和post请求
  app.use('/signout', require('./signout'))
  app.use('/posts', require('./posts'))
  app.use('/comments', require('./comments'))
  // 404 page
  app.use(function (req, res) {
    if (!res.headersSent) {
      res.status(404).render('404没找到')
    }
  })
}