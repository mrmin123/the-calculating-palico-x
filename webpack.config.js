'use strict';

var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: "./main.js",
    output: {
        path: path.join(__dirname, "build"),
        filename: "bundle.js"
    },
    plugins: [
        new ExtractTextPlugin("[name].css")
    ],
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: [
                        require.resolve('babel-preset-es2015-webpack'),
                        require.resolve('babel-preset-react')
                    ],
                },
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass-loader')
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            }
        ]
    },
    resolve: {
        extensions: ['', '.js'],
        modulesDirectories: [
            'node_modules'
        ]
    },
    resolveLoader: {
        root: path.resolve(__dirname, 'node_modules')
    }
};
