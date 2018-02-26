const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signin 登录页
router.get('/', checkNotLogin, function (req, res, next) {
  console.log('登陆的用户为：'+ req.session.user)
  res.render('signin')//中间件先检查，没有登录过就将登录页面渲染给前端浏览器
})

// POST /signin 浏览器点击提交post后，用户登录信息到后端验证登录,注意有中间件先检查有没有登录过
router.post('/', checkNotLogin, function (req, res, next) {
  const name = req.fields.name
  const password = req.fields.password

  // 校验参数
  try {
    if (!name.length) {
      throw new Error('请填写用户名')
    }
    if (!password.length) {
      throw new Error('请填写密码')
    }
  } catch (e) {
    req.flash('error', e.message)//三个模板常量，user，success，error，每次req都有。
    return res.redirect('back') //返回当前网页
  }

  UserModel.getUserByName(name)
    .then(function (user) {
      if (!user) {
        req.flash('error', '用户不存在')
        return res.redirect('back')
      }
      // 检查密码是否匹配
      if (sha1(password) !== user.password) {
        req.flash('error', '用户名或密码错误')
        return res.redirect('back')
      }
      req.flash('success', '登录成功')
      // 用户信息写入 session
      delete user.password
      req.session.user = user  //这里将user写入了session
      console.log('用户是：'+ JSON.stringify(user))
      //用户是：{"_id":"5a47bc03f1a6c91ca4b03115","name":"tomy","gender":"m",
      //"bio":"文件下载在静态文件夹中","avatar":"upload_a4cb6e1e89f110e883db529d9dd46f64.jpeg","created_at":"2017-12-31 00:17"}


      // 跳转到主页
      res.redirect('/posts')
    })
    .catch(next)
})

module.exports = router

// 这里我们在 POST /signin 的路由处理函数中，通过传上来的 name 去数据库中找到对应用户，校验传上来的密码是否跟数据库中的一致。
//不一致则返回上一页（即登录页）并显示『用户名或密码错误』的通知，一致则将用户信息写入 session，跳转到主页并显示『登录成功』的通知。