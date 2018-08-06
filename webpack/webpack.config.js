const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const glob = require('glob');
const PurifyCSSPlugin = require('purifycss-webpack');
const webpack = require('webpack');
const entry = require('./webpack_config/entry_webpack.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: entry,
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback:"style-loader",
                    use:[{
                        loader:"css-loader",
                        options:{importLoaders: 1}
                    },"postcss-loader"],
                    publicPath:"../"
                })
            },
            {
                test: /\.(jpg|png|gif)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        limit:500,
                        outputPath: 'images/'
                    }
                }]
            },
            {
                test: /\.(html|htm)$/i,
                loader: 'html-withimg-loader'
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback:"style-loader",
                    use:["css-loader","sass-loader"]
                })
            },
            {
                test: /\.(jsx|js)$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["es2015","env","stage-0"]
                    }
                },
                exclude:/node_modules/,
            }


        ]
    },
    plugins:[
        new ExtractTextPlugin("./css/main.css"),
        new HtmlWebpackPlugin({
            title:'Output Management',
            minify:{
                removeAttributeQuotes:true
            },
            hash:true,
            template:"./src/index.html"
        }),
        new PurifyCSSPlugin({
            paths: glob.sync(path.join(__dirname, './src/*.html'))
        }),
        new webpack.BannerPlugin('注释'),
        new webpack.ProvidePlugin({
            $:'jquery'
        }),
        new CopyWebpackPlugin([{
            from: __dirname + '/src/public',
            to: './public'
        }])
    ],
    devServer:{

    },
    watchOptions:{
        poll:1000,
        aggregateTimeout:500,
        ignored:/node_modules/
    }

};
