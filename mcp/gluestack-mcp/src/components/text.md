---
title: Text
description: Inherits all the properties of React Native's Text component with multiple styling options via classNames.
---

# Text

Inherits all the properties of React Native's Text component with multiple styling options via classNames.

```jsx
import { Text } from "@/components/ui/text";

function Example() {
  return <Text>Hello World!</Text>;
}
```

## Props

- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` | `6xl` (default: `md`)
- **bold**: boolean (default: `false`)
- **italic**: boolean (default: `false`)
- **underline**: boolean (default: `false`)
- **strikeThrough**: boolean (default: `false`)
- **highlight**: boolean (default: `false`)
- **isTruncated**: boolean (default: `false`)

## Default Styling

<!-- BASE_STYLE_START -->

The Text component uses the following base styling by default:

```css
/* Base styling applied to all Text components */
text-typography-700 font-body

/* Additional web-specific styling */
font-sans tracking-sm my-0 bg-transparent border-0 box-border display-inline
list-none margin-0 padding-0 position-relative text-start no-underline
whitespace-pre-wrap word-wrap-break-word
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "2xs": "text-2xs",
    "xs": "text-xs",
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg",
    "xl": "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl"
  },
  "bold": {
    "true": "font-bold"
  },
  "italic": {
    "true": "italic"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
  "highlight": {
    "true": "bg-yellow-500"
  },
  "isTruncated": {
    "true": "web:truncate"
  },
  "sub": {
    "true": "text-xs"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Examples

```jsx
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <>
      <Text size="2xl" bold className="text-blue-600 hover:text-blue-800">
        Large Bold Text
      </Text>
      <Text italic highlight>
        Highlighted Italic Text
      </Text>
      <Text size="sm" isTruncated>
        This text will be truncated if it's too long for its container...
      </Text>
    </>
  );
}
```
