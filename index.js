// 生成一个 express 实例 app，挂载了一个根路由控制器，然后监听 3000 端口并启动程序。运行 node index，打开浏览器访问 localhost:3000 时，页面应显示 hello, express。

//res.render 的作用就是将模板和数据结合生成 html，同时设置响应头中的 Content-Type: text/html，告诉浏览器我返回的是 html，不是纯文本，要按 html 展示

// const express = require('express')
// const app = express()

// app.get('/', function (req, res) {
//   res.send('你好，第一个node程序')
// })

// app.get('/users/:name', function (req, res) {
//   res.send('hello, ' + req.params.name)
// })

// app.listen(3000)

//require 过的文件会加载到缓存，所以多次 require 同一个文件（模块）不会重复加载
//require 目录的机制是:
//   如果目录下有 package.json 并指定了 main 字段，则用之
//   如果不存在 package.json，则依次尝试加载目录下的 index.js 和 index.node（这个文件应该是c编译后的文件）

const path = require('path')
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')//connect-flash 中间件是基于 session 的，所以需要在 express-session 后加载。
const config = require('config-lite')(__dirname)//可以将基本的配置放这里，本例是mongo数据库的配置信息

const routes = require('./routes')  //所有的路由处理都交给routes目录下的index

const pkg = require('./package')//可以引用package.json中的内容，如下面的pkg.name
const winston = require('winston')//新建 logs 目录存放日志文件,引入所需模块：
const expressWinston = require('express-winston')

const app = express()

// 设置模板目录
app.set('views', path.join(__dirname, 'views'))
// 设置模板引擎为 ejs
app.set('view engine', 'ejs')

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')))
// session 中间件
app.use(session({
  name: config.session.key, // 设置 cookie 中保存 session id 的字段名称
  secret: config.session.secret, // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  resave: true, // 强制更新 session
  saveUninitialized: false, // 设置为 false，强制创建一个 session，即使用户未登录
  cookie: {
    maxAge: config.session.maxAge// 过期时间，过期后 cookie 中的 session id 自动删除
  },
  store: new MongoStore({// 将 session 存储到 mongodb
    url: config.mongodb// mongodb 地址
  })
}))
// flash 中间件，用来显示通知
app.use(flash())

// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/img'), // 上传文件目录
  keepExtensions: true// 保留后缀
}))

// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
}
//优先级：res.render 传入的对象> res.locals 对象 > app.locals 对象，所以 app.locals 和 res.locals 几乎没有区别
//app.locals 上通常挂载常量信息（如博客名、描述、作者这种不会变的信息），res.locals 上通常挂载变量信息，即每次请求可能的值都不一样（如请求者信息，res.locals.user = req.session.user）。
//我们将 blog 变量挂载到 app.locals 下，将 user、success、error 挂载到 res.locals 下

// 添加模板必需的三个变量
app.use(function (req, res, next) {
  res.locals.user = req.session.user
  res.locals.success = req.flash('success').toString()
  res.locals.error = req.flash('error').toString()
  next()
})
//这样在调用 res.render 的时候就不用传入这四个变量了，express 为我们自动 merge 并传入了模板，所以我们可以在模板中直接使用这四个变量。

// 正常请求的日志
app.use(expressWinston.logger({
  transports: [
    new (winston.transports.Console)({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/success.log'
    })
  ]
}))
// 路由,,,,注意：记录正常请求日志的中间件要放到 routes(app) 之前，记录错误请求日志的中间件要放到 routes(app) 之后。
//注意：中间件的加载顺序很重要。如上面设置静态文件目录的中间件应该放到 routes(app) 之前加载，这样静态文件的请求就不会落到业务逻辑的路由里；
//flash 中间件应该放到 session 中间件之后加载，因为 flash 是基于 session 实现的。

routes(app)  //=====》那末，就到routes目录下找index来处理路由

// 错误请求的日志
app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/error.log'
    })
  ]
}))
//   刷新页面看一下终端输出及 logs 下的文件。 可以看出：winston 将正常请求的日志打印到终端并写入了 logs/success.log，
//   将错误请求的日志打印到终端并写入了 logs/error.log。

//实现了将错误信息用页面通知展示的功能，刷新页面将会跳转到主页并显示『权限不足』的红色通知。
app.use(function (err, req, res, next) {
  console.error(err)
  req.flash('error', err.message)
  res.redirect('/posts')
})

// 监听端口，启动程序
app.listen(config.port, function () {
  console.log(`${pkg.name} listening on port ${config.port}`)
})