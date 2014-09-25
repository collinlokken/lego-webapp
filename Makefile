
#
# Executables and paths
#

STYLUS     = node_modules/.bin/stylus
UGLIFY     = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify
WATCHIFY   = node_modules/.bin/watchify
NIB        = node_modules/nib/lib

#
# The dev server PORT
#

PORT ?= 3000

#
# The main CSS and JS files
#

CSS_MAIN   = app/css/style.styl
JS_MAIN    = app/js/index.js

#
# All CSS and JS files (used for file watching)
#

CSS        = $(shell find app/css -name "*.styl")
JS         = $(shell find app/js -name "*.js")

#
# Compiled CSS and JS Files
#

BUILD_CSS  = public/app.css
BUILD_JS   = public/app.js

#
# Browserify Transforms
# See https://github.com/substack/node-browserify/wiki/list-of-transforms
#

TRANSFORMS = -t reactify

#
# Default task
#

all: $(BUILD_CSS) $(BUILD_JS)

#
# Build CSS files
#

$(BUILD_CSS): $(CSS)
ifneq ($(NODE_ENV), development)
	$(STYLUS) --include $(NIB) --compress < $(CSS_MAIN) > $(BUILD_CSS)
else
	$(STYLUS) --include $(NIB) --include app/css --include-css < $(CSS_MAIN) > $(BUILD_CSS)
endif

#
# Build JavaScript files
#

$(BUILD_JS): $(JS)
ifneq ($(NODE_ENV), development)
	$(BROWSERIFY) $(TRANSFORMS) $(JS_MAIN) | $(UGLIFY) > $(BUILD_JS)
else
	$(BROWSERIFY) $(TRANSFORMS) $(JS_MAIN) > $(BUILD_JS)
endif

watchify:
	$(WATCHIFY) $(TRANSFORMS) $(JS_MAIN) -o $(BUILD_JS)

watch:
	$(MAKE) watchify & $(MAKE) public/app.css & wait

#
# Start a local dev server listening on PORT
#

server:
	@supervisor test-server.js

#
# Remove build files
#

clean:
	rm -f $(BUILD_CSS) $(BUILD_JS)

#
# Non-files are PHONY targets
#

.PHONY: clean server
