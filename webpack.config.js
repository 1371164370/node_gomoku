const path = require('path');

module.exports = {
    entry: './src/app.js',
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'main.js',
    },
    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                use:{
                    loader: 'babel-loader'
                },
                exclude: '/node_modules/'
            },
            {
                test:/\.css$/,
                use:['style-loader','css-loader']//程序会先加载css-loader，然后在加载style-loader文件
            },{
                test:/\.gif$/,
                use:{
                    loader:'url-loader',
                    options:{
                        outputPath:path.resolve(__dirname,'public/img')
                    }
                }
            }
        ]
    }
};
