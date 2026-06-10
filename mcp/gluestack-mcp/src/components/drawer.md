---
title: Drawer
description: A responsive Drawer component for React & React Native that provides a sliding panel for navigation, filters, or additional content.
---

# Drawer

Drawer is a responsive sliding panel component that provides additional content or navigation options without leaving the current context, supporting flexible positioning and styling through className.

```jsx
import { Button, ButtonText } from "@/components/ui/button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import React from "react";

function Example() {
  const [showDrawer, setShowDrawer] = React.useState(false);
  return (
    <>
      <Button onPress={() => setShowDrawer(true)}>
        <ButtonText>Show Drawer</ButtonText>
      </Button>
      <Drawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        size="sm"
        anchor="left"
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader>
            <Heading size="3xl">Heading</Heading>
          </DrawerHeader>
          <DrawerBody>
            <Text size="2xl" className="text-typography-800">
              This is a sentence.
            </Text>
          </DrawerBody>
          <DrawerFooter>
            <Button onPress={() => setShowDrawer(false)} className="flex-1">
              <ButtonText>Button</ButtonText>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
```

## Props

### Drawer

- **size**: `xs` | `sm` | `md` | `lg` | `full` (default: `sm`)
- **anchor**: `left` | `right` | `top` | `bottom` (default: `left`)
- **isOpen**: boolean - If true, the drawer will open
- **onClose**: () => any - Callback invoked when the drawer is closed
- **defaultIsOpen**: boolean - Specifies the default open state of the Drawer
- **initialFocusRef**: React.RefObject<any> - The ref of element to receive focus when the drawer opens
- **finalFocusRef**: React.RefObject<any> - The ref of element to receive focus when the drawer closes
- **avoidKeyboard**: boolean - If true, the Drawer will avoid the keyboard
- **closeOnOverlayClick**: boolean - If true, the Drawer will close when the overlay is clicked
- **isKeyboardDismissable**: boolean - If true, the keyboard can dismiss the Drawer
- **children**: any - The content to display inside the Drawer

Inherits all the properties of React Native's View component.

### DrawerBackdrop

Inherits all the properties of React Native's Pressable component, created using @legendapp/motion's createMotionAnimatedComponent function to add animation.

### DrawerContent

- **focusable**: boolean (default: `false`) - If true, Drawer Content will be focusable

Inherits all the properties of @legendapp/motion's Motion.View component.

### DrawerHeader

Inherits all the properties of React Native's View component.

### DrawerCloseButton

Inherits all the properties of React Native's View component.

### DrawerBody

Inherits all the properties of React Native's View component.

### DrawerFooter

Inherits all the properties of React Native's View component.

## Examples

### Filter Drawer

```jsx
function Example() {
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [brands, setBrands] = React.useState([]);
  const [colors, setColors] = React.useState([]);

  return (
    <>
      <Button onPress={() => setShowDrawer(true)}>
        <ButtonText>Show Drawer</ButtonText>
      </Button>
      <Drawer isOpen={showDrawer} onClose={() => setShowDrawer(false)}>
        <DrawerBackdrop />
        <DrawerContent className="px-4 py-3 w-[270px] md:w-[300px]">
          <DrawerHeader>
            <Heading size="md">FILTERS</Heading>
            <Button
              variant="link"
              size="xs"
              onPress={() => {
                setCategories([]);
                setBrands([]);
                setColors([]);
              }}
            >
              <ButtonText>Clear All</ButtonText>
            </Button>
          </DrawerHeader>
          <DrawerBody className="gap-4 mt-0 mb-0">
            {/* Categories section */}
            <VStack className="pl-2 py-3">
              <Text className="font-semibold" size="sm">
                Categories
              </Text>
              <Divider className="my-1" />
              <CheckboxGroup
                value={categories}
                onChange={(keys) => setCategories(keys)}
              >
                {/* Checkbox items */}
              </CheckboxGroup>
            </VStack>

            {/* Additional filter sections */}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
```

### Sidebar Menu

```jsx
function Example() {
  const [showDrawer, setShowDrawer] = React.useState(false);

  return (
    <>
      <Button onPress={() => setShowDrawer(true)}>
        <ButtonText>Show Drawer</ButtonText>
      </Button>
      <Drawer isOpen={showDrawer} onClose={() => setShowDrawer(false)}>
        <DrawerBackdrop />
        <DrawerContent className="w-[270px] md:w-[300px]">
          <DrawerHeader className="justify-center flex-col gap-2">
            <Avatar size="2xl">
              <AvatarFallbackText>User Image</AvatarFallbackText>
              <AvatarImage
                source={{
                  uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                }}
              />
            </Avatar>
            <VStack className="justify-center items-center">
              <Text size="lg">User Name</Text>
              <Text size="sm" className="text-typography-600">
                abc@gmail.com
              </Text>
            </VStack>
          </DrawerHeader>
          <Divider className="my-4" />
          <DrawerBody contentContainerClassName="gap-2">
            {/* Menu items */}
            <Pressable className="gap-3 flex-row items-center hover:bg-background-50 p-2 rounded-md">
              <Icon as={User} size="lg" className="text-typography-600" />
              <Text>My Profile</Text>
            </Pressable>
            {/* Additional menu items */}
          </DrawerBody>
          <DrawerFooter>
            <Button
              className="w-full gap-2"
              variant="outline"
              action="secondary"
            >
              <ButtonText>Logout</ButtonText>
              <ButtonIcon as={LogOut} />
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
```
