(: Quote hightlighted text :)

let $name := 'dynamic'
return object-node {$name:
  object-node {
    'inner': json:to-array((1, 2, 3)),
    'another': 14,
    'tisNull': null-node {},
    'xml': xdmp:quote(cts:highlight(<msg>Here is some text</msg>, "text", <b>{$cts:text}</b>))
  }
}
