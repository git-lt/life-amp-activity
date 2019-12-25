const gulp = require("gulp");
const babel = require("gulp-babel");

gulp.task("default", () =>
  gulp
    .src("js/index.js")
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
        plugins: [
          "@babel/plugin-proposal-class-properties",
          "@babel/plugin-proposal-object-rest-spread",
          [
            "@babel/plugin-transform-modules-umd",
            {
              globals: {
                "es6-promise": "Promise"
              }
            }
          ]
        ]
      })
    )
    .pipe(gulp.dest("dist"))
);
