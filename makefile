SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)
MOD   := dist/dateify.js
MIN   := dist/dateify.min.js
SRC   := src/dateify.es
SPEC  := spec/test.es

TEST  := dist/test.js

all: install build
build: $(MIN) $(TEST)

install:
	npm install
	bower install

clean:
	rm -r dist

test:
	phantomjs spec/run-jasmine.js spec/index.html

jasmine:
	jasmine

serve:
	node spec/server.js

$(MOD): $(SRC)
	@mkdir -p $(@D)
	babel $(SRC) -o $@

$(MIN): $(MOD)
	@mkdir -p $(@D)
	uglifyjs -cmo $@ $^

$(TEST): $(SPEC)
	babel $(SPEC) -o $@

.PHONY: test clean build install all jasmine
