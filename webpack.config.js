// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const toml = require('@iarna/toml')

const isProduction = process.env.NODE_ENV === 'production';

const config = {
    entry: './src/main.ts',
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js', // Output filename for bundled JavaScript
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
        }),
        new NodePolyfillPlugin({
            excludeAliases: ['console']
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.toml$/,
                use: ['@lcdev/toml-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
    },
};

module.exports = (env, argv) => {
    if (argv.mode === 'production') {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
