---
title: Slider
description: A customizable slider component for React & React Native that allows users to select a value from a range.
---

# Slider

A customizable slider component for React & React Native that allows users to select a value from a range. Inherits all properties of React Native's View component with className styling support.

```jsx
import { Center } from "@/components/ui/center";
import {
  Slider,
  SliderThumb,
  SliderTrack,
  SliderFilledTrack,
} from "@/components/ui/slider";

function Example() {
  return (
    <Center className="w-[300px] h-[150px]">
      <Slider defaultValue={30}>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Center>
  );
}
```

## Props

### Slider

- **size**: `sm` | `md` | `lg` (default: `md`)
- **orientation**: `horizontal` | `vertical` (default: `horizontal`)
- **isDisabled**: boolean (default: `false`) - When true, this will disable the Slider
- **isReversed**: boolean (default: `false`) - When true, the slider is reversed
- **isReadOnly**: boolean (default: `false`) - To manually set read-only to the slider
- **onChange**: (value: number) => void - Function called when the state of the Slider changes
- **defaultValue**: number - To set the slider's initial value
- **value**: number - The slider's current value
- **minValue**: number - The slider's minimum value
- **maxValue**: number - The slider's maximum value
- **step**: number - The slider's step value
- **sliderTrackHeight**: number - To change the slider track height

Inherits all the properties of React Native's View component.

### SliderTrack

Contains the slider track.
Inherits all the properties of React Native's Pressable component.

### SliderFilledTrack

Represents the filled portion of the track.
Inherits all the properties of React Native's View component.

### SliderThumb

The draggable thumb element.
Inherits all the properties of React Native's View component.

## Default Styling

### Slider

<!-- BASE_STYLE_START -->

The Slider component uses the following base styling by default:

```css
/* Base styling applied to all Slider components */
justify-center items-center data-[disabled=true]:opacity-40 data-[disabled=true]:web:pointer-events-none
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "orientation": {
    "horizontal": "w-full",
    "vertical": "h-full"
  },
  "size": {
    "sm": "",
    "md": "",
    "lg": ""
  },
  "isReversed": {
    "true": "",
    "false": ""
  }
}
```

<!-- VARIANT_STYLES_END -->

### SliderThumb

<!-- BASE_STYLE_START -->

The SliderThumb component uses the following base styling by default:

```css
/* Base styling applied to all SliderThumb components */
bg-primary-500 absolute rounded-full data-[focus=true]:bg-primary-600 data-[active=true]:bg-primary-600 data-[hover=true]:bg-primary-600 data-[disabled=true]:bg-primary-500 web:cursor-pointer web:data-[active=true]:outline web:data-[active=true]:outline-4 web:data-[active=true]:outline-primary-400 shadow-hard-1
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to SliderThumb based on the `size` prop passed to the parent Slider component:

```json
{
  "size": {
    "sm": "h-4 w-4",
    "md": "h-5 w-5",
    "lg": "h-6 w-6"
  }
}
```

### SliderTrack

<!-- BASE_STYLE_START -->

The SliderTrack component uses the following base styling by default:

```css
/* Base styling applied to all SliderTrack components */
bg-background-300 rounded-lg overflow-hidden
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to SliderTrack based on the props passed to the parent Slider component:

```json
{
  "orientation": {
    "horizontal": "w-full",
    "vertical": "h-full"
  },
  "isReversed": {
    "true": "",
    "false": ""
  },
  "size": {
    "sm": "",
    "md": "",
    "lg": ""
  }
}
```

### Parent Compound Variants

These styles are applied to SliderTrack when specific combinations of props are used on the parent Slider component:

```json
[
  {
    "orientation": "horizontal",
    "size": "sm",
    "class": "h-1 flex-row"
  },
  {
    "orientation": "horizontal",
    "size": "sm",
    "isReversed": true,
    "class": "h-1 flex-row-reverse"
  },
  {
    "orientation": "horizontal",
    "size": "md",
    "class": "h-1 flex-row"
  },
  {
    "orientation": "horizontal",
    "size": "md",
    "isReversed": true,
    "class": "h-[5px] flex-row-reverse"
  },
  {
    "orientation": "horizontal",
    "size": "lg",
    "class": "h-1.5 flex-row"
  },
  {
    "orientation": "horizontal",
    "size": "lg",
    "isReversed": true,
    "class": "h-1.5 flex-row-reverse"
  },
  {
    "orientation": "vertical",
    "size": "sm",
    "class": "w-1 flex-col-reverse"
  },
  {
    "orientation": "vertical",
    "size": "sm",
    "isReversed": true,
    "class": "w-1 flex-col"
  },
  {
    "orientation": "vertical",
    "size": "md",
    "class": "w-[5px] flex-col-reverse"
  },
  {
    "orientation": "vertical",
    "size": "md",
    "isReversed": true,
    "class": "w-[5px] flex-col"
  },
  {
    "orientation": "vertical",
    "size": "lg",
    "class": "w-1.5 flex-col-reverse"
  },
  {
    "orientation": "vertical",
    "size": "lg",
    "isReversed": true,
    "class": "w-1.5 flex-col"
  }
]
```

### SliderFilledTrack

<!-- BASE_STYLE_START -->

The SliderFilledTrack component uses the following base styling by default:

```css
/* Base styling applied to all SliderFilledTrack components */
bg-primary-500 data-[focus=true]:bg-primary-600 data-[active=true]:bg-primary-600 data-[hover=true]:bg-primary-600
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to SliderFilledTrack based on the `orientation` prop passed to the parent Slider component:

```json
{
  "orientation": {
    "horizontal": "h-full",
    "vertical": "w-full"
  }
}
```

## Accessibility

- Keyboard navigation support with Tab, Arrow keys
- Screen reader compatibility with appropriate ARIA attributes
- Support for disabled and read-only states
