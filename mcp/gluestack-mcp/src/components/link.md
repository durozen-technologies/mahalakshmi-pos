---
title: Link
description: A navigation component for React & React Native that directs users to different pages or external resources.
---

# Link

A navigation component for React & React Native that directs users to different pages or external resources. Inherits all properties of React Native's Pressable component with className styling support.

```jsx
import { Link, LinkText } from "@/components/ui/link";

function Example() {
  return (
    <Link href="https://gluestack.io/">
      <LinkText>gluestack</LinkText>
    </Link>
  );
}
```

## Props

### Link

- **href**: string - URL that should be opened on Link press
- **onPress**: (event?: GestureResponderEvent) => any - Callback that will be invoked on Link press
- **isExternal**: boolean (default: `false`) - If true, link will be opened in new tab on web using the \_target property
- **isHovered**: boolean (default: `false`) - When true, the link displays a hover state
- **isFocusVisible**: boolean (default: `false`) - To manually set focus visible state to the link

### LinkText

- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` | `6xl` (default: `md`)
- **isTruncated**: boolean (default: `false`) - When true, text will be truncated if it exceeds its container
- **bold**: boolean (default: `false`) - When true, text will appear bold
- **underline**: boolean (default: `false`) - When true, text will be underlined
- **strikeThrough**: boolean (default: `false`) - When true, text will have a line through it
- **italic**: boolean (default: `false`) - When true, text will be italicized
- **highlight**: boolean (default: `false`) - When true, text will have a yellow background highlight

Inherits all the properties of React Native's Text component.

## Default Styling

### Link

<!-- BASE_STYLE_START -->

The Link component uses the following base styling by default:

```css
/* Base styling applied to all Link components */
group/link web:outline-0 data-[disabled=true]:web:cursor-not-allowed data-[focus-visible=true]:web:ring-2 data-[focus-visible=true]:web:ring-indicator-primary data-[focus-visible=true]:web:outline-0 data-[disabled=true]:opacity-4
```

<!-- BASE_STYLE_END -->

### LinkText

<!-- BASE_STYLE_START -->

The LinkText component uses the following base styling by default:

```css
/* Base styling applied to all LinkText components */
underline text-info-700 data-[hover=true]:text-info-600 data-[hover=true]:no-underline data-[active=true]:text-info-700 font-normal font-body web:font-sans web:tracking-sm web:my-0 web:bg-transparent web:border-0 web:box-border web:display-inline web:list-none web:margin-0 web:padding-0 web:position-relative web:text-start web:whitespace-pre-wrap web:word-wrap-break-word
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": "web:truncate"
  },
  "bold": {
    "true": "font-bold"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
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
  "sub": {
    "true": "text-xs"
  },
  "italic": {
    "true": "italic"
  },
  "highlight": {
    "true": "bg-yellow-500"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Accessibility

- Keyboard navigation support with Tab and Enter keys
- Screen reader compatibility with appropriate descriptive link names
- Support for focus management and various states

## Examples

```jsx
import { Link, LinkText } from "@/components/ui/link";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { ExternalLinkIcon } from "@/components/ui/icon";

function Example() {
  return (
    <Link href="https://github.com" isExternal className="flex items-center">
      <HStack space="xs" className="items-center">
        <LinkText size="xs" className="text-primary-600 font-medium">
          Visit GitHub
        </LinkText>
        <Icon as={ExternalLinkIcon} size="xs" className="text-primary-600" />
      </HStack>
    </Link>
  );
}
```
