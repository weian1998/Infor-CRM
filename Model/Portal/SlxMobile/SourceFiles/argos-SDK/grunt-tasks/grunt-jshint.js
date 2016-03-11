module.exports = function(grunt) {
    grunt.config('jshint', {
        options: {
            jshintrc: '.jshintrc'
        },
        all: ['src/**/*.js']
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
};

