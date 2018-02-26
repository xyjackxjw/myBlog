module.exports = {
    checkLogin: function checkLogin (req, res, next) {
      if (!req.session.user) {
        req.flash('error', '未登录')
        return res.redirect('/signin')
      }
      next()
    },
  
    checkNotLogin: function checkNotLogin (req, res, next) {
      if (req.session.user) {
        req.flash('error', '已登录')
        return res.redirect('back')// 返回之前的页面
      }
      next()
    }
  }

// 给博客添加权限控制，如何实现页面的权限控制呢？我们可以把用户状态的检查封装成一个中间件，在每个需要权限控制的路由加载该中间件，即可实现页面的权限控制。在 myblog 下新建 middlewares 目录，在该目录下新建 check.js，
 
// checkLogin: 当用户信息（req.session.user）不存在，即认为用户没有登录，则跳转到登录页，同时显示 未登录 的通知，用于需要用户登录才能操作的页面
// checkNotLogin: 当用户信息（req.session.user）存在，即认为用户已经登录，则跳转到之前的页面，同时显示 已登录 的通知，如已登录用户就禁止访问登录、注册页面