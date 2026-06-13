# pythontamilfont
ReportLab, Pillow and python base Libary's TamilFont Render Problem Solved Code

This repository contains code that solves a render problem with Tamil fonts in python base Libary's. The problem is that Tamil fonts are not rendered correctly when they are used in a ReportLab document. This code fixes the problem by using a noto fonts rendering.

#example

![Screenshot from 2023-04-21 23-04-23](https://github.com/alauvdheen/pythontamilfont/assets/8154989/34202a3c-63a5-4e02-908e-25d4e9df7934)

To use this code, simply clone the repository and fonts import the module into your project. Then, use the tam() function to render Tamil text in your document.

the code only working with attached fonts 

Usage

python
from tamfontpy import tamfont

text = "ரோஜா பூ அழகாக பூத்துள்ளது"

Render the Tamil text using the ReportLab Tamil font renderer.

rendered_text = tamfont(text)
text1 = rendered_text.tam()
Print the rendered text.


![Screenshot from 2023-06-08 21-11-07](https://github.com/alauvdheen/pythontamilfont/assets/8154989/c63ebe9f-1b2f-42c7-92a1-7c15d6a13972)


print(text1)

Code snippet

## Output

ரோஜா பூ அழகாக பூத்துள்ளது
![Screenshot from 2023-06-08 21-44-46](https://github.com/alauvdheen/pythontamilfont/assets/8154989/23a536ce-f575-462a-a52f-c8d80a6a8056)
