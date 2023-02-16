const path = require("path");

module.exports = {
    entry: "./app/index.tsx",
    mode: "development",
    devtool: "source-map",
    target: "node",
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                options: { presets: ["@babel/env"] },
                resolve: {
                    fullySpecified: false, // disable the behaviour
                }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: {
                    loader: "file-loader",
                    options: {
                        outputPath: "img",
                        publicPath: "./images",
                    },
                },
            },
            {
                test: /\.(ts|tsx)$/,
                loader: "ts-loader"
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            }
        ],
    },
    resolve: {
        extensions: ["*", ".js", ".jsx", ".ts", ".tsx"],
    },
    output: {
        path: path.resolve(__dirname, "public/"),
        publicPath: "/public/",
        filename: "bundle.js",
    },
};
