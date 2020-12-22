/*
FeedbackPanda Browser Extension
(C) 2019 Arvid Kahl

License: MIT
Author: Arvid Kahl <arvid@feedbackpanda.com>

# What is this Extension about?
  This Extension enables teachers working for the Chinese online teaching service
  VIPKid.com to quickly access the student feedback generator tool FeedbackPanda
  directly from their online classrooms.

# What is VIPKid.com?
  VIPKid.com is an online teaching portal, designed to allow North-American language
  teachers to teach English to Chinese children. They are using a web-application
  with flash-based video conferencing to connect teachers and children. All of their
  services are only accessible with an account that requires interviews and mock
  lessons to be activated.

# What is FeedbackPanda?
  FeedbackPanda is a web application designed to allow Teachers to quickly generate
  lesson feedback for their students. Students, Courses and Text Fragments can be
  managed on FeedbackPanda. When a lesson has been taught, pasting the URL of the classroom
  allows FeedbackPanda to receive Classroom, Student and Course IDs. From that,
  the tool inferes Names and Contents, therefore generating personalized comments.

  Access to FeedbackPanda is handled via Auth0, allowing account creation without
  payment or restriction.

# What does the extension do?
  The extension adds a tiny button to the Classroom page. When clicked, the URL
  of the Classroom and data extracted from the Page get sent to FeedbackPanda
  for processing. For some schools, a group of buttons is added to tabular or
  list pages of classrooms or courses.

# More Details
  This browser extension is used by the FeedbackPanda web application to allow for
  integrations into Online ESL (English as a Second Language) Teaching Portals.

  Supported Portals as of this version:
   - VIPKID.com (vipkid.com.cn)
   - MagicEars (mmears.com)
   - ALO7 (alo7.com)
   - Landi English (landi.com)
   - TutorABC (tutorabc.com.cn/)
   - gogokid (gogokid.com/)

  FeedbackPanda is a SaaS that allows teachers to quickly write student feedback
  and keep track of students and their achievements. It uses teacher-supplied
  text templates to generate student-specific and lesson-specific reports.

  This extension grabs the student name and (where possible) internal student ID as well
  as the lesson name and (where possible) internal lesson ID and transfers those
  to the FeedbackPanda application, so the database can be queries for items with
  those IDs.

  It will do these things, in order:

  - detect if it is being run on a supported site
  - detect if it is THEN being run on a supported part of that site
  - only then will it set the 'detected' variable
  - only if the detected variable corresponds to a supported school will it
    attach the panda button
  - when clicked, the panda button will invoke logic to extract lesson and student
    information and send it to FeedbackPanda in a new tab

# What data is accessed?

  Only transactionally relevant data is accessed. This data is used to identify
  courses and students through ID numbers that are being used on the teaching
  platforms. Private information is not accessed. Student names on these platforms
  are usually pseudonyms and are stored only for and by teachers who are authorized
  to view and use this information. Upon account deletion within FeedbackPanda,
  all student data is also removed irrevocably.

# Privacy Policy

  You can find our Privacy Policy at https://www.feedbackpanda.com/privacy-policy/

*/

// Version used to communicate with the FeedbackPanda website
var version = "fbp-browser-extension-1.21.22"

// Has a supported ESL portal been detected?
var detected = null;

// Local, in-page cache
var localCache = {}

// Inlined Image for the Panda button
const pandaImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpGRTQ2MkRGOTBGMDcxMUU4ODRBMkFDMDUyNzJBMkQ5MiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpGRTQ2MkRGQTBGMDcxMUU4ODRBMkFDMDUyNzJBMkQ5MiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkZFNDYyREY3MEYwNzExRTg4NEEyQUMwNTI3MkEyRDkyIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkZFNDYyREY4MEYwNzExRTg4NEEyQUMwNTI3MkEyRDkyIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+KUf3mQAAMB1JREFUeNrsXQeYlNXVfqf3ndm+sI2OdCEgiqAoGMVCFLBFDdb8MRrsiaixxhZjiGDB3kFNQLAioDSlS++wsL3X2Z3e/nPuzLfuws7uzjaWZC7PAXZmZ+ab77z39HOuLBAIILr+d5c8eguiAIiuKACiKwqA6IoCILqiAIiuKACiKwqA6IoCILqiAIiu/4GlDPdEv169O+xD/C4fZAoZej81AYbBCfDWuLr/ztAp4avz4Mh9P8BTZofCoGrq1/jBIXy7iBKJFESVRMeI9hDVdpfvcyT7WGQAiK4WN85lRDOIxhBlEGlCz3mJiom2Ey0l+oTIFlUB/z3rGt5QRIuJfkvUvwHzJXCkhQDyFlEB0f1EsigATu1lJPqSaCFRZgSvMxO9QLQjwtdFAXDSlz+AgNcPmQzJ9NNWokvb8W7DiXYRjTgljMD/0sVGmoUoJiS2VSHR7CbyEFmJqoQeJ+azIai0aDTeCscyemxgB3w+f+4KojOJjkYB0HkrjmhQA8oM6eXEkCjXh5ivbGC4MdmJ6ogqAgHkKvTK7coYzXiSAqd34LXxNbxNdF4UAB23dETjiCaFdteIEAgikQwsEQyCQQH0VsaoR9esL5hm21cezgVsz5pIdGvISIwCoI1LTXQh0XSiKURJHfXGMrVcxC4qvjgCb7UL6mQSGB1fOTcrCoC2LQ663EZ0A1GPTjEUjGrYdpWhjkhp1nQG83kNCwH326gX0Lp1BtHnRIeJ/txZzGeTUKaSw7anDF6rE3K1ojO/05SoBGh5jSR6NiTuO33JFCT+nV44jtVAJpd3dvhmcBQA4Rfr9H8SXddZHxBoQrbLaMP77B54Khwif9HJKyNky7ijAGi87iL6e+jmtHv5Aj54iTx+ryBfwC+YHwQA/R3CgYz4LZer4Ld5UZRfAKe1Clq/ARqtFmq1GgqFgp7vUK2pjwKg8epLtCCk79vFcKfPDYfPRYz3Qk1MNSr1SNEmwKKOgUVlgllthF6hg06uhlKuFMqfX+dReOF0u3F0RjKObTkAm9eBwvx8VFZUwO4gqUAoMRqN0On1UKna7R5yWtQTVQHBdWPILWqT1cU7nJnl8DmhIYYnE7NHGVPR15iO3oY0pOqSEK+JFcw3KLXEyJB+l52gF4LrhZlweTyoq61Dfl4ecnJysH/vXuzetRN7du9Bbm4O7DY7DAQGk8kEpTKyWymTE+Ds3lxPmd0lRI/sfxsA7xDdFKGxDhbkdq8TVq8NWtrJzOwRsQNxuuU0DDT1Rk9dIhQqxS+M9UFIBJffA26JCyoAfz3PZaG/+V95QAEl7fD4uFhBI0YMx9Splwl1kZubi5+3bsXaNWvw49q1OHTwILw+H+Li4qDT6dBiux19gM/mIRdTuyP5t4OCOQdf4H8SAPFE30Qi8mVCVPtR46kVuz1dn4Jfp4zD+MRRgvExWqO4wSQQ4CE14HS56P627uYGGvzt8/jh8TSWzqz/2RbIzMwQNG36NBQUFGLl8uX4YukS/LjuR5SXlyM+Ph56UhHhgBDwBgQAet4+8pK0O0e95C61ZeMktWjKwl1kF1QEcR59TWv9eWa8n/5Uua1iBw+O6YMLU87G+cljkWpKDn4OMc3hdxPDfZ1/40hssw2gUQftABfZDat/WIUFH32EZd98A2ttLZKSkqDRaOD3+xvtfm81qameJvSbMwkKvaqWvA6OB/zUmdf79a9f61YSYDTRSgRz5S0ynndlNe14m9eOoeb+mJY2GZNTzoJJZxBi3eFyCtHelYqUN46bmM7EkoEZfeFFF2LSBZOxfNkyvD7/dXxPkoElRnxCQv1rWNz76ryIndwL6mQDaPeb6Km1RFOZT/+9KoB2jIz1sQxj6acfQi5Qs0tOv8w7utxVJUT9H/tdjd+knQ+DTg+/2486h01ocFmT1lzXLd7hjpCHoCUgXHzJJZgw4Rx8+OEHePmlucjKykJKSgq5kxq4imphGJqA+Mv6ERDcbMjwpbNv+RXR5QiWkZ3SAGBXbmhItHN2jevhCuHzr6L700+VqP8u4PHrWQcKvSdretfzU2XEeDbVrkq/EDf1mYYeMQmC8bV2m3hcFvrTXRbvcIfTKeIFBpMRf7zjDpw17mw89/TT+OKLpTAEtDCbzUj940ioEnTwlNiP//5LEAwPLzvVAMBijNOb1yMYum30tTie7nf7rPnzfg5Y9pSZLedkQJNqhKfSiYCTRLdc1ki3crCm2FmO/sYM3DXgBkzo8SuxU+rsdmEHdDfGnxCHII/AbndAQa7hyJGnY/6bb2Bw/9Mw7/VXYLi9P8xjU+EusYUTWl8gmNreeqoYgTeHQrbmZn02+stb5YTf4YGuXyySrjwNcZf2Q8Djg4+NQgKBnHzzOo8NVaTvL+15Lu47bSZiDWY4nS64yfDrzkwPt1gasB3grrLji+3f4T3N96h11iE2YEAg/NcpIjqLKKezjcD2AIALKD4J6a0InPeAyLFzwiV+an+kzfqVkBC+ajcxvoZsugDu7Hctru97mXhJrcsWTlOcUiCQK0jNk/G3Jnsj5pZ9hipfLeKU5ibzEaG1hWgsOigZHQ4AbQ1sa4lWRcR8ycUmEa+M05EO1KN80UHkPLWepEAAFeo6Ecz5+4h7cX3/y+DxemF11TUI0Jy6i1WC30fKSyvH2fEjcXf81TArTQQCqzB0wyzuN3izs6+trQBYGBJRbbWWRNWNOs2E6lW52PzYl0gImDBv3F9xTupoMqRcIsjTnUQ+u3ocGRSkULQJBCzy5YlajI0bjjss0wjwGlh9tuZAcAuCIfJuZQTeFfHODyMNFColCryVyMyKwT/63ouBlj6w2RwiKXOymc+qkfMFer0WimYygB6vj2wUZ+j3m79mP4GADUMZgeBs7whU+WvxWvXncATc0MrU4dTBPKL1RIe6AwDYtftrR+2ogrw8pPXKxOIvv8TAzL6oq/vFyj/ZzOfkjl6nFdJo7eo12LZ1C4qKisRONlss6NO3L341ZgxGDB8Ok9EgVJbD4WwRBD76PaVaBX+CFhd4zkCurxRLatZArbSE+95cxfwSOql6KFIAcC1efEcwv6ysDDExMfho4UIMGToYNnKb/AF/izewK5jPVrtWo8ayb5fh+Weewbaffxa7XBES/cJwputMSEjA6DPOwA0zZ+Lyyy9HDPn+/D0YJM19D6/HA7VBB1+sB9O95yLLnY99jmNIIBCEkQIXIZgse/dk2wDTO4L5VqsVHrcbr77xBs48cyzstHNaumldFhihnc/Mf+/ddzH1kkuw/qefYKEdn5aejh49e6JnaqogjuzxNX/71Ve49sorMZ0AsHfvPhj0OgGgljKCrA7UFj0SjfG4ynS+qE1w+F3Nyb7HEWxqOWkA4ADP8HYFHTjIQ+gvqyjHw48+iiumXQGX2wMvicXuwHxmGov9jRs24q47/yQyepm9ekFFDOXrk66R/2VpwM+nZ2QIMHzx5ReYPHEiPl/8uQAQ5waaAwGHjxUKsgcsKozQ9cck42hY/bbmfD4uH5t9MgEwvL0fxrcvLz8P06ZNx+yHHxJf1uVydQvm8+JcPq9nn36aRLlNZPMaZvKYofzz8Y9xVrBv7z6w22wkDa7Cxx9+JLKE7DE0BwK2B7QGA5QGDSbpRiNVnQib39GcFGADvP/JAkBau/V+eTl6ZfbCCy++KB6zWmu7DfN5qZQKrFq1GuvWrkVKcopgNF8fM7G6qgqFBQUoKixEIRH/a7fb66+ffzeZJIHeoMcffv97/PDDD9BrNS17GhwoilGjlzYFEwynEwCczUkBfsN7TpYRqGnPB3Ha1FZXhxfnzEEvsvzrbPaOLrBst23Ca/2PP6KuthaxsbHiMZZQpaWlGDp0KC646CJkZmaK77Jrxw58+803AggpPXoIIDAI2DDMy83F/Xffgx/WrYXFbIa1ti4s0NmO0JIq8epcONM5GGvV20WFk16uDXepUuj9SFcDwNEe3c8u1JRLL8XNt97C0eD63dWdwrW8srOzRT8AM58ZzRU+t9x2Gx5/6ikkxDduN9y4aQsevP8+bNqwAalpafUgYCNx++5dmP/qa3hw9oPivcJWB9HjcrYvjEpk2FIwUjsA31jXNwcATQgED3W1CshrK/MdJCoNhPIH/vIX8VhtbftEf0ODrKOW9H5u2vHy0P9Liotx7XXX4eVXXxHMz8o6ig/e/wBLlyxFXZ0NZ44dg0VLlmDc+AkC4A2lSYxOj6WLF6O6xgqDQd9ilFCrC3oPIzT9hEfgbb6qidviTF0NgN1t/ZCS0hJMmzED48efLaz+SEW/FGVjEHHQxUg3lEn8n4h3b3vPPfCFDLvY+HjBkFpyVTNI3D/w4IPi8eXfLcdlU6bgtptvxnVXX41rr7oKR48eQzwB4+X5r6FPnz7CvZWuN4ZEf9aRIyKG0BJUWWoIg1ErRy9VT2Sok4VL2II9NrWrVcBOom1EoyL5AN79FrNFiFG0weqXXDP2z9lu2LplCw4eOCBcx169e+OMsWORmBAvCj9t9HxrQrLh/HJeo0aNgpwAVVlZicunTcPAAf3Jba3Ew7NnY//hQ+iVli4++6tvv4HjlluwnIy9QacNRP8BA5B97JgoEZfiCRVk83AFcatD41oVElQx6K3qgQOOHNri+pakwMddHQn8LBIAMCNYh06bPh1njTsLbo83QuZDRNf8ZDS8+/a7eO/dd7Bvzx5hffN+Z1+bd960GVfij3+6E7EWM+o4otiGoJIkQS4mO4WZuWf/PgwdHvR8169bh8OHDiG9R08hbZi5vdMzsHnTJtx4ww3oQUbgrp07ERcf3+i7Myi9Hk8rP5+kgIYTTSpkEgDUcqWIjHKNRJg1mWgA2pkjiNQM58aNwtb+Mn95vmHTrrxS/Mzh1EgYEmMyoKKyCleR+rj51pvF7mddye4WB184lMz1do88+gguPP98bN++A0a9Lqhi2qASakmvs66/74EHxM9cviXZLKwWJNXF18bfi+MESxYtwtx//Us8z4BspNfp58Sk1o0tYLAoOTCkkCNRYYFWpoEP/mbt1lCIuEtDwRVEj7Z299eQThxM7tPESZPqA0GtuhmkE3nnV5AYnnrxxVj0+WJkpqYhlaxrvsnykJXOAZjExET0ycgk5m/Dby65BPv2HxD2gb8NABCVvgTaG2+6Ebfdcivp/e/E40cJZA1dxYYSgxncs2dQMkgBIv7udST+2Rs4feTIVos78f5KsnWghYEMQV/L5e0XdjUAePF8m/daczPZnz5n4kQkxMWKeD9aIZaDOz+oR2+7+Ras37QRfTN7CWY3DMywLWGz2eqlSu/efZBfVIhZf/wjPD5/vS6O2GNxBAMxb7z1JoYMGYLT+vXH3597TnT9NNX+dbxHIrmCldYaXHLZZcjMSA9+95ZNgKC7KAvArDQgVmmCp2UAcO1gUqcAgFukw5LDc5PP5v7cU+XgYs8mGcvin0Or4ydMqBeJrQ3I8NvNfeklfL50idj50g3m52pqakREjt+fmzQ5qcSRObbAe5FeXrt6FT5buLBhnWnEASGOUDJDHnxoNmb/9a/o168fCgoLhFvIBmA4IEu5jqO5ORg9chS9Puiqi9e0xuARFyAjIaAE/wm0XA3GyaGx9W/Bk81UZKMY1dxw0ogiNgJV8brw18ofpFVO0/Qwflq3q/QqT4kNylitmKxRb/3TzuQM2umnnx6RCGbXLi+/AC/PnQeL0SR8Y2nnS1G3WXffjbPOPhuxtCurSE1wj96H772HstJSyOQKfL9iBa67/johNTweT5tAUFtbJz575szf4YorrhDZwQUffiiMPXYZTQQ+bhuXJBIHjawETi8ZblN+fSHmv/mmcBGbiwKGkwQR1jwzAL5knjCjucjWVeIQtkS7vIB+L5zXLFq5yYOYnlu7pQilnx4AAUFIAwIG5BoF6iqtGHfWOJFN46qZSMKxnyxYgCNHs9CbdDsznx8vLirCoMGD8c4HH2Do0CGNXjdp0vmYQYbm7eRq/kQqg6N5fOOFhPC0rfuamcZM5UIPI9kjs+6ahZk33ojvli0TIeCd27ejoqJCSDbW/6zvzyNb57KpU3H1NVcL8LBR2QZDJNSw2mobZhQ3lvIsI3WSHrn/2IzST/ZDnWJo/FtTIwSAwqxp8UL9du+Z5rPTYBiRhNotxbBuKYQzqxqecgfo1mHAwNOEKHa2kgmsMpwut2itMmi09SFUtsK5CuelV14RzGe//L233sLBgwcxmEAx8+abMWzYUHz4ySeYdO65KCZJwZ06bEhGGglsGFASj7EtQ4xkJptiTLjq6qsEFRWX1CeEtCQJUlJ6EAh6iCiilwAv7fzW7n5JkrDh7/R74Ay4m3MBG7oPA5Uxap1MKXMcued7VK3NA/0fnkpH+ySA39Gi3uKGt4HuUhtkGiUsE9NhOTddMN9ZWgddWX8MHz8uFGTxty4eT2jZtmsX9u/bJyJpEjM4E/cH7rI560zU2uxip7NnIAuJzBVkrb9D4rl3r0w89be/4cUXXhDg8Qeajywy4JRNiEq32yN6EWRyWSPDjgNNvHh390hJFtTodR6vME7bHIxiaUe3qsZXhyqvFSpZC8WndH0Kg6q3yqJNz5q95lDpV4egSzWLMvuAP9A+ALRipbIXxAZRgEQ/M140d+iV0PSzIH6AFml9MsTwkwjEGQ7u3y8YLvnPnpAxOfG8oEr69OOPsZiYn0Y7jh/n55etXIH7yC5Y8MlCYXuw2mH7oCnx3zCyyPV+O3fuw6EDB8QEEA7HDh02DOPGjRM7vo68jKbC1lJTaEvSJFKVw8ain6SHHS6SAm5y9OVN7XjISM3Srpc6BmTl32QNr1yZfUjXM0bYYa1lfnsBkN7UxbHk4C4eORlDxgxNq51/6UYXkFhtmCnkG51AYOjVp4/4eTvpXiW9KYtdEUMPReXY8Jtw9njs3rEDf549G0oCY1OqR4ovfPj+B/h80SIR4WN3lf1/BoeGdvdNt96K50iK6A0GOB0OdMXiCmThLZC5VOytELkAs8J4gtrlngo29Kq+z0Hd9hK4i2ywH658lwAxR6ZWZtPvvIJgw0773EDu3WPSZpiERyDXKH8xU39JSIRRS35oFRpBrd38EsO5ZqChCOWwrhTwEdFEYkjD9KoUlTMQszZv3Cg+bsoll9SL1IbilT2MY8ey8cb815GUnCwYzWVdHF3kYA4HmhhYc1+eh6VLlkCl6Lp6BVY3HrJ/3D438rwlIgjUqF+AmU98cOXX4tgj65D95E8oW3wI1p+L+YYbyQNIo98Zj2DPxoftBkDh/B2Ccp/fhOrVueI3VYS+BiImLrwrQxdL+ktF/mxrASD9mhi81ECE8jCmKhLPn5GBt3r1GuzevRuW2NgTxLrICBKTuTWbGzI569jQsDOTAVdSUioKODMyMvDb316LZAIBA4M/k0HF78EAUMmCk0C6jPkhA9Dv9KDSW4Nsd7FoGmmUKCLfntVsDjG+ak0uqQCNsPRVceSKnqjzuUn3xXapgIL5O4I7h3SSKlYHdYIOKTcNQ8LUfvDWuHnKR1xzc/Qi7eANhHYr70xZA0ONmcP/PvvUU8GSbY1GGIj+BoElfp4lA4eJb7711hOyjlKxxxvz52PTz1thIB/9I3Int2/bBhWpEJYe/N5sM+QVF+HKK6bhN5dfDm8rjdf27365CGjJXAHk+EpQ6CkTjSKNjD3y8Ys/2ou63aXQpse0RrXeS7QIwaaSyAHA4l8STezfu4rqkP34T7BuKESvR8cx8ozhDn9ixou5fDy1o5UYkEQ6+/o8eYt1P+9GqUmDJYGUcPE3EVUsKCnGDdffgAt+fQFcx2UdJQDwMCdeHMzh9+dybwYUg4XTv3VOBy6/bCpef/tt4ZHUWOtOMAKbchfbu7jziLOYDMA97mOw+5zQK3+pCGKrnlvp63aUQm5QB+V26z5+VksAkLe8M2knKkkkJuqhStSh7MuDOPrwOg74+DVpZB8k6aE0qYM9/vXRTJmwYp0+V0SdnT76rLFnnolhw4cLq7xh9o1B0DDb1tB45Ahgz6RkPPLXYNOS67jYuxSK5XgB/155TbVgegm9Ljv7mIgmDho0CC/Pexn/XrwYsbEW4ccfn/zh78WJJoVC3mEAYEBxZNFrc5PxV4mdjsPQyRt/T1a77Nd7iRRaRST9wtxNlNIhXoAAgkpu1KZbzq9Znz/o2OM/TtKmm0TAyDAkAfoBcaTDfPBZXcJ9sRGKrR5bRADgoAobajfdcgtWrV0jgjmSFAjnOTDzrHYb5r76KvoP6E+um6Pef2+UmCIffvLkSeQyrsSif/9b5BPY7eO08ojTT8eEc89FHDG+YRCn4eulVrENGzYiLi4effr2iSi9HZYBXOhSVwu5048d7sPId5UiThlznIqga/D4xRCsCJMc/EZnh1RBuwDAMvRBQt4DpPfN7BWwG8L+P0ed+GfLOelIvmGIcFN8FTZ4yRUsdVXWq4TWxAKEHia9e8PvbsDa1avx1rvv1Pv7DS16KTDDAxz533kvv4LfzfydmNTl9zddDCICOSRmOWLI1IQHS89zh5L3BOZLrWJr1/2Im66/XoSjBw7sD2cH7H5OW7utTlR4qrHOvkMYz3L60/B+iU40jrEowge3mllj2gsANrm/C71Rvfhh65P/zzfIZ/eSgbIP9oOV6P3kBKhjef5NFQodJeJ36sOcrbgh3FzBFjvX2bFx9Nbbb0ElVwh9zbuFxTn77Q6PGyOHj8Azzz8vpnNxFM7p5Ild4TN1DAKOz0sWv5SlPB5c9dFCLu40BmPqK1d+L2oBKyorRKdQh+h+RXD3K+x+bHTtxUFHLhKaGhrB0pfsABmJ/0B1xAgYGMoaVrfJBkBwcNGYMNaeQKbCqIImwwTrliIUf7wPCjJUVCo1sm2FIpmilLW+n16kfEkEc0CGc/ILFizE5AsuEABgpnG9PkcFX3ppLlaQlGDmc0SPxbG8leKRGc4GF1OjGX6SrqdrYFVkIn1vI3viySeexAzyCjgVzQ0jTru93cznzxBDrKudyCerf1ndJmhkKrH7m8y+6pTi6JpA5J5JQmgTt0kC/IHonNY48QwEnntX+U0WLBNSYR4Tj+yyAhQ5ypBh6CGig62+ObQLWQ+z/r/m2mswfcZ0UYHLDOAyrd69e4XSxEHd3t4eA9Hrx0YmvaeEIX7fJWQQvjJvHjZv2YykhETx2QyajihJ58+rqagUM5O+sW9AjqsIycq4JlUlZ/sUBqUwtnnKaITLgmaaSpsDAA8Jav2sfrouOfmqnlK7CCD16jcR5Ton9ldnIcPcI+KZ2MK3p13tcgWTNgMHDvjFqqdd0JDx4RgiQrvkOUjVRKE3Fi5eU69gG2H3rl0irPz1V19h29atAmi9MjLFjmUjVXQP63TtNvy4WhrVHmx1HcCK2s2wyE3hbSUhAVRQsLcVuRGgRjNj95sDwMgQRZDOCoj5d7a95Sh+ZQc09w/AdrJsL/SOh0ImFzN+IwUBL0eYeHxLO5F1eFVVFVnvOhFHYBCwzuegC6eYOZ9fXFyMY0ePYh9PAt+5E/v37xePGw2GYK0fMUsMlmai16vpvbgYtX2i3w93uQ1FzjJ8bF1ObqAPWoUhvKEsrMDgBqtPgUYmhGRtAQB/S0Pk8pQMxEQ9Kr7OgilZjh1/SkOJrxLJijhYvXVdNv1DFvLZl339NZ564gnR08c7j6UK7z7O9NVUV6Oa3EgbAYw7dTkvwEEoDhVzLp4Z4gn8Mk3c7nYhnd6HM41tvSa25GtLq8Q1fFS3HEedBWFFf6M4Ob9WJWvLzDCO1jnbAgBH6MWRNYUyWLlayKxB7fuHsdXox4bHp+By7fjgYepd1A4ojYO/cMoUPPvM06KRw6I3BieM8sAnRXAcvI52upF2NBuYwRH0fLfIW6Cv7paRCxiQ0U0Kni1gddiRmZ4uYgdur69Nor+u2iqGZS+yrcGa2u1IUFjqN3Vzm4qFnc/uC93giD62JpwH0BIA9hNx7HR4G+4+5GSxKsl4KZu3C+8mv4VL7huPGJ2RbmJdlzWFcnEnu5Svv/kWLpo8WYhf9iKOt/wlxleRoVIr8yEloMbEQCyG+Y3oCx3i6OfkgAqfemTQDB8iDEWP2x0h81Ww15IL6glgtWEvvnBsRFyMBWqPkqSPLzwCxL1Uw1fngSOritzBiDP4VSEQRAwAPuh4Ddo6GIKLFGPUiPWb8d3DH+Ol+FG4/8ZZ0Gq0cLqcXQICYbiRGzdmzGg88tijuPe++4SYbzjChVOuNfCikpg/hDTeDF8SLgrEY2jACC2U9eKX5eEKgxl9zxtf70q2mvkkaVzsptJ7LVnzNV7c8R60PU3QpSUhkKKCOlYfPEPAJQ45qM/scQheaSLXUKtCwcfbYT9UBZUl4i797BAI2uQGvk/0pzaLYfoiaosOsT4znrx9NhLkZtz4u5mkB/WivEou73wQiCobYvY9996Lndt34v2PPhCNJApRMhZAnsxJO1yFxwK9cYuvJ3oE9HTn/bATKKrghpf+nyjTYX3lAWz/dTpmTZzc6ixhcJSMEm6yHRQKGRZ/vRR/vv8+eGxuxFviUMPxk8wYGAbHQz8wHpqeRj6smhgejJv4HT5xeGXFd8dQRaTkI2wVEdsB+9uTC/iZ6CME88ttEwRciJFggbfCh9tvuhU1ldW46+67SDQbRcBH3smSgJnAJd6sCl5943UUFhZgxQ/fi4rjIrkHZ/hj8C/fAIwkke+XkSSQOUMT3INH0pg5LWtz4Dkcw6/vfIAcagWs9pbVmDRHyOPlqeh+LPx4IR6Z/RC8Hi8SkhPF0EhOALk2FsK6oUDk+1VJOqji9eL/LPo9VU44c6zwVTsJGFrINIq2uIF7m73OVswK5pO3uSs4rj2M4JtRTVZ3eWUFHnxwNp5+9pmgnq7tGpuAd7vZZKRrqMGM6dPxPYHgD8nD8JrqdHpShiqZQxwfLmVa+d84GYlblx+3lH0L65+uxL/nvh4KOTevwqTWNa6McthteP3V+fjH838XWcQ47mQOSRDRR8HnBXn9QgX4XV6R9An4G0RZdcog41u0FJtcRaFQcO2R7GNoayiYJ1bf214GiAGLZjNSkpLxzHPP4vrfXgcbuUJco9faXEG77IFQdNFiMWPxl0sx7cYb4CwpQUlxIdedIZacnQSoCOUq+leDOL8WhyuKcGnZl8i7/gK8NWdeKCbRPPPF5C8+AYJ+p7S0BI8+9DCefvJJqDVq0T3csEJaMDuIGAEG3vncYKOK14pcC6sDwXygrSOjNyDoe7VLAkjrVaLbO8Iw42KMnIJ8jD9rHN5+/30M6N9P9APw450tDYK9h8Fil3++/za+/serOG1PCc4i4Z6pCUZMc1xWrEU5tqTpMGHWjfj7/Q9BK1OECkRkzYr84OGTcjE25qknnsSa1atFF/HxGc0mwzQdvwd41jCfyIZwEiDScfF8zs+kjtDL/Lm5OTmio+a1N97AlIunCDHNTRhdAQKODiqVChwsL8YnSz/H/h83wplXLKJy8qQ49D1jJH57+XSM7jOApJdfHFYRzl4RmUV6Tq1SivawhQsWYM6L/xTpaqlzuFkJ1zkAYN9/cEgNdBgAeOtwidGwjnLTOBTL6uGRxx7D7Idm1ydiOnuIlMj6cTUxAYE/hvV/hcsuwr1xWnIVQ1057EaGG2Qp6XoO8PDTWzZvxitz52Hp50vI9VOKiWHSZ52E9U5IAqAjAcCLvxUfcTago0DAcfni8jLMuGIaXnr5Zdo1PbpMJdRnTNTq+vZvZrgn1CcQVtzT73I0kWcL8qmifFzce++8K/oSudpY6ls4iYtT+Fs7AwC8eBbKagQPh+oQEPANz83PQ/++/TCHdtGUi4PDL7iAo62tVp3hUjLjObvIjSdcU/jl0qWiwnjTxk0iyBQXyhOcpF0vLZ7kclvDBzoaAJI64FM/J3TUzWUWs0rgY1jvuvdePPbE42LMChd8dFQePvILg0gMcShXEwrDFtI1cpLp359+JoZJs2WfkJQgRrycZMZLrh/PcSrubABIi0/7vrYjw7c8XqWorBQTyEt4Yc4cjB0bPFmW1UJb273bch2829XcNCILxhG4aXX5su/w9ZdfinlFXO3Eer4108G7cF2KJg6g7EwA8OK5QU90pKhlY6ygoEA0bdw5axb+7447GnXj8swBLgIN+HytGj3Tms9ko1AtjoT5JTzCbeDs0n2/cqU4OCIr64gAR1xsrKgN7AzGB0fV2EVMIUJw3Y3g4RLoagDwukwml33id/n0InuqlLfbrZEMRB41x2NaJl1wgagH5EMaemVmnBj3J1EsYv8EHqmIo0lVI5OLqJwY+XZc/x/v6pzsHOzatVMwfjPp9n2087kcjecOMXXEYMrmvjMXsbCdoQ1NIGml6vs9mjlkqvMBQHIy4PT18Ht8ywP+wFAGABcxtqWO+XiGiWpeAgKHkrluj9u/hwwbhhEjRohOor4EDs7Rc6RNGUFDp5uYXV5WhsKCQuTm5mD/3n1CzO/fvw95uXmotdaK416Z6Vxa1pkRS4nJ+fn5Inbw8aef4u233sKHb7+LtLT0YKxAHjba939oYZJr5wGAFSTtPGduLQKKAAbMvSDdU+zYXvDatng+HpZ7CqFo29y+phbvcK7N4wlhnJNny5sPZ5ZmB3JvIbth3D8oBkCwaxeKo7Na4ePkuZmEg1DVNdWoKCsXN50BxsSSQavV1aeNuyJMLX1GTk62mHbGzOcU9srvV2LqhZeIqWFqVTBMLCSrP5CP4LF974S8sRZXxwIgdEN5Yhj3DXLjYvxFfcSMmuTfDeUBRbOqf8x7qfjtXaj9uVjEuBW/DDTo0GCO5LNzqxeTLxS0OUFsymShHoXGj4mmD21wYITUiNqVSxpJn1tYgLPOGIsPFyxA37596Dv5RD/EfR89jm+yV8NSo1lY/NHeuXKNslamkPF00Iis4XAAaNuAiFC2itvFeZdzIWjqnaMEQu0HK1jHzo35VcoM/YD4CeWfH0Tpfw7CXVgnuoZ4iBQ6sK+OmcbEO7YhMASwA01X2gVH0Z38uAJfB6u1sqpK3HDd9XjltddI3RjFGBxugDUbTLhuxrXYll1yQKfR3Wo9UGavXV0AdbK+wzZTWAC4CurCvsjnJaabdDjtzYsE8xkE3LvuqXCIejuhX4tt99LO39Lj5uGIOTMVpZ/tR/UPOXBzbpuBoFZ0GBCaNvS673mjksjPy8sTNs2cf87B3ffcLZ6z1tqElBK/4wtgiLwP+hbF3X80sdIePzIN1uW5HSpJwwIg9Q/h5/txTyCXKHMjCIt/nh7C6qC+kiJoG2wlYDxAj7+g7W1G5sPjEDu5F8qXHIZ1UyG8VQ6oYrSi3amNue5Tcok4B9kaReVlOONXozFn7lyMG3eW6BAWp6g0GIopU8uQdfDIoozcmK8zquLgTO+BovQ9cDtdUGnUnQuAns0AQDL8XEUkqiodv3Ssyk6wFf7BkUJvpXMq57tjxvaEaWQyrJsLUfldNmq3FsFTXBdseiAgCQNH9t/JeNEGTmKdDU62O/7ywJ/xyKOPivMOpISTxHxWXCaDAUeysnLnvjHvdpfHDZPeAL9SBlOcGWX5xZ0vAZpTASeAofl1EzF1c8Dr7+vhkXIk+i0T0gkMqbDtLUPNj2SBby+Bi7wIf6VTvJ9b5YXKqIVG1a0ibO0S9+xuWm11OO/ciXjsqacwYUKwuPT4XAf/X6sKFn7uKTpwTV52XplGroZNWQuT2YTEpESU5BZ2PgA6cHGP+NXgNLJMpuYqGHeJXVTAGIclwkgSgewF2A9UwnGoEq6SOvjzHcjbmYXKgBcJiYnCyDvVgCAxnoM6leRuDhowEM/efbcYYcN1Aw2znY2Yr9GQhFDhH6/88/a3P3xng9wZdH2DoWkFaqtqxNGzHeWeKrvofnBx6TVEiyVVwXVwngqnCG4oDWqSCmkwnZsKB+nBe5KuhWaXE8/MfQ4b1v8kXsJAaG5YRHdiPAeumPFV1hr0yeyFu4jxv7/9diQnJwldL42QPX4OARuEHIrecWzPs58t+c/8A5v2NmlDSAO0TyUA8PocwZKy106IJzjEBHK4yLWV+2XoMzANg2b0w4Spk0S6lXPtXFpVVFwkjp+JCXXydCcwMENcoSAT9z0MoB1/1z33iLE0PDKeV7hzhcUQCmK8hgy79ds2fbAld/tDCqkWUHmc+61Ah9pJyi6+T/OJ2GFvcoQZp1V5tqAioBQTRrlka8aVMzCd6KcffxKjXVYsX44jh4KnpPDMAG76VCpPXhrWFxpYUU27Xa/TY8zYseKElBkzZiAllLxqWFXUNPM5GKXGxm2bF2/csWlmTGqseKwrlvIk3LN/hrA8pwkHM3gSiDLYkSNm89IN49k8fOIYU2FRsZgNzKd58GBIaUyM0WQSwSBp5l9nLWm4BA+05LQ1TxnjRNU1516PS6dOFQdk6EIuWnOMr9f5atL5GhU2bNv8n607t16p19J3UHad8as8SRLzXxzzQPD0kUZ+Iw99EIdLyBq2hzvrz+jt2SMFM2+cKejwkSz8tG6dKMrYsW2bOLVLnBnAIV5iDOcC+DWsLqSRMLJWnloiMVtqJ+cWdc4j8Ku5vH3QkCEYPWaMOBCDmZ6clBh6TaDVswt0Wr4+Bb5dv+LVbbt33JFqSYFPHtGo+FMWALw4kVGA4AgarcQc3jEOl/MEPSc9Z60NVgZxdq5/v76C+Iyf8opKMdxhFxGfLMZn9rF0kFrAeRYw5/vlIabIQuFg6WPEGUN8MDSCSSOuSmJJxJKFJ5Py2Ud8mtjwESME8VBpi/mXOQHHF6u0BLQYcdqJFwuX/ecvy7Z9//dR6cOF22vzOrqUCScTALx4+BQ3n35L1FdKjFht1rAtK9KNlZI/vLgwg0/7Ou+8iYKEf027kEfBMQgK8vPFgRNcV8DWOR8KyVPFPWKqmF+AQrSKk8QwhRjOs4k5w8hHwvK8AP7XaGiYb+BTUdwEytbnZOrnGut17Bq6lq9ded3XG79dZEgwQ6/Wtumgq1MdALwOI1hc+j7tz6tqfS5Ueq0RHWfFjJTatRkgbBTyKaN86CPTiZYGRK0/SxTpODhlqBIo3L7lsgbe5fyatupnSeTvOXhg/8qfV031Op1HEkyx8CmDZwSejNUdACAkKAeL6PZ/61P4Xy9xV6rhQ5t8XWnm7/G1g6LkKzQeTtLNUiZRUgEeT5C57KuLqqIOKOtuuOvtdid2HNn16tPP/+2OxLQUnHPmeBSUF3Wpzu+uAAgGOSB/z6cMLM+pzudx5+cbaRdzR05HWMSCsbTbW3t6Wbs/jyeR0B+DziBaw7Pz83IXrV4yM7sib7VJZYROpesm97w7RdE4zqFWFpbWlk/66ruv/lRZWeVgvasL1cadCkuCql6jFbMGa+qs3hUbVj353lcf9TuUn7U6Rh8DlU6FAE+L6AZxLGV3u4EqBfnxARl+PrD95U25uz4eN3TMU6MHj/pDYny8wucNkIfg6LbhYAaplix5lVoJm82Bn7Zv/HjXod0PegK+fO4tiNEbRTdRd7r+bgcAaVJncnwy9lUdrfrrnEfvvPS8S5//zQVTH+kRl3xzSkKSMiDcLhe8fu/J30UyLnlUiIAOdw5Xktu5d/f+T8nIe6KqonI/XTN69kwVJexwdT/QKtFNFxthZmMMjGojS4S8r9Z98390kx8d2nfI7UP6DLo1LSU1VRvQCIPN7XWLMHJXGlPM9GA/oVxU7hSUFVcczjvyftaxrLnbD+zMsSrs6GPJEDaAvxsnsLotACRfG7Tf1Vq60Ro1n6dTsnHf5sdXb1zzt56JKRefc8a516fEJ09JikswyjTBE0rYkvf6vMKt6siZ/sK9VAQ7hYTLRm9dVlXmyispWHEo+8iCo4XZixUqucusNsGkM0JB1ysDun32slsDoCEQWC1o5BrRKbQve4/3yMGDX5jiLV+Ub66wJFkSLhyQ3u+ixPiE8fHm+H5xZosY5cJ2o0oVPB5OePiyoP8vgeP40z8UIlIoF0Di3+HsHKcVPB6/SExV1VQjv7gqv8JatS4/P/+7VbtXLcutzisZlT4adrcDGbFp0EDV6FCr7r5OCQAcb2arSCLExJlh1ptxJPdYdWl12aebd23+FCSORw8ZPazGXj3mzAGjf5UYn9TH7XGfnhibaFQo5EZWKyy6GRk8F4ALL6TFg6Q4jRuM4Ys+hrqcolw7IWFPZU1V1tGS7G0KpWLz+i0bduqg9fGxtBxZNOj0iLPEwVddhlNxKXGKLza+TKRn3WR1B/j4mJrS3Z+t+vfuAYl939m0/2cUFhfprpx8he5gcdZgTUDZKyMpXT6032D/ofwjqp1ZexO0Ko3CoNeXjew93FVSUiw/UnjMX+uxFQ5KH7B7+6Fdde+9845j2pQrcNiVi5F9h0HGk0MJRMx0baUWToXzlC5olZ3qNXfR9V8UCIquKACiKwqA6IoCILqiAIiuKACiKwqA6IoCILqiAIiuKACiq5PW/wswAG3nGMv8P30DAAAAAElFTkSuQmCC"

try {

  // jQuery-based _.uniq :)
  function unique(array) {
      return $.grep(array, function(el, index) {
          return index === $.inArray(el, array);
      });
  }

  // We send a callback to the background script here, which in turn will open
  // a new tab to FeedbackPanda with the URL and lesson data in the query string
  //
  // This is the legacy method. URL-based message passing (instead of link passing)
  // is described below.
  var sendToContext = function (data){
    var lesson = ""

    // We extract the Lesson Name, we might be able to present that to the Teacher
    // depending on the school.

    // VIPKID has it right there in a span called lesson-name
    if (detected == 'vipkid-flash') {
      lesson = $("span.lesson-name").text();
    }

    // Alo7 has a breadcrumb navigation with the last part being the lesson
    // name
    if (detected == 'alo7') {
      lesson_text = $(".path-link:last").text();
      lesson = lesson_text.replace(/(> Class Report for) \W+/g, '')
    }

    // MagicEars shows the lesson name in 3 boxes, so we fetch them and con-
    // catenate. The student name is also in a box, so we put it all together
    if (detected == 'magicears') {
      var student_name = $("div.class_perform table td.stu_name").text()
      if (student_name) {
        lesson = "unknown [unknown] ("+student_name+")"
      }

      var levels = $("div.class_perform table td.level");
      if (levels && levels.length === 3 && student_name) {
        lesson = $(levels[0]).text().trim()+'-'+$(levels[1]).text().trim()+'-'+$(levels[2]).text().trim()+' [unknown] ('+student_name+')'
      }

      var course_name = $("div.class_perform table td.course_name").text();
      if (course_name) {
        var course_topic = $("div.class_perform table td.topic").text();
        lesson = course_name.trim()+" ["+course_topic+"] ("+student_name+")"
      }
    }

    if (detected == 'landi_english') {
      lesson = btoa(JSON.stringify(data))
    }

    // Now Send the URL and the Lesson Data to the background process
    chrome.runtime.sendMessage({"message": "open_in_feedbackpanda", "url": window.location.href,  "lesson": lesson});
  }

  // Clicking on the Extenstion icon also triggers the callback
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if( request.message === "clicked_browser_action" ) {
        let supported_pages = ['vipkid-flash', 'alo7', 'magicears']
        if (supported_pages.indexOf(detected) > -1) {
          sendToContext()
        } else {
          alert("Hello there! Please use the Panda Button directly from inside your Teaching Portal to open FeedbackPanda from this location.")
        }
      }
    }
  );

  let removeVerboseDataFromMessage = function (message) {
    try {
      // For VIPKID, remove the bulky previous teacher comments
      // The idea here is that with smaller query string size, browsers have
      // an easier time parsing it to open it in a new tab.
      if (message && message.school && message.school == 'vipkid') {
        if (message.custom_data && message.custom_data.student && message.custom_data.student.teacherComments) {
          message.custom_data.student.teacherComments = []
        }
      }
    } catch (e) {
      console.log("Ran into trouble removing data from message", e)
    }
    return message
  }

  /*
    How attaching the FeedbackPanda button works:

    The main idea is that we detect if we are in a certain school by checking the
    URL of the currently loaded page using regex further down below.

    Then, we start a loop. This is required as some schools are single-page
    applications, which means that the panda buttons will need to be reinitialized.
    Hence the loop.

    Then, we check which part of the page we are on by testing for certain DOM
    elements to be present. If found, we call the `attachButtonToElementFor{SchoolName}`
    function with certain data, which does the following things:

    1.  It creates a new FeedbackPanda button DOM element with the FeedbackPanda
        image and puts them into the DOM at the location which we want them to be in.
        The CSS used comes as a parameter to the call
    2.  If adds a click listener to the FeedbackPanda button
    3.  The handler for the click listener then injects some JavaScript into the
        running application. That usually finds the live Vue instance that is attached
        to the DOM element provided, or some other element that has information
        that is needed. That information is then merged in a JS object and
        stringified. The result is added to the DOM element as a CSS class,
        prefixed with `fbp-tx-` for transaction. This makes it immediately
        available to the code following the JS injection and is read out
        immediately. No other data is accessed.
    4.  The data we read out of that string is then transformed into a JS object
        called message, which follows a certain structure. That message is sent
        to the context, which can be found in  background.js. The method there
        then opens a new tab with the message data wrapped and encoded as a query
        string.

    After this, FeedbackPanda takes over and uses the data to show student and
    class information so that the teacher can create their Feedback.
   */

   var attachButtonsForVIPXClassList = function (type, element, data, buttonCss, imageCss){
     let feedbackButton = document.createElement("button");
     let feedbackButtonImage = document.createElement("img");
     let hash = Math.ceil(Math.random()*1000000000).toString()

     $(feedbackButtonImage).attr("src", pandaImage)
     $(feedbackButton).addClass("fbp-attached-button").addClass("fbp-attached-button-"+hash).attr("title", "Open with FeedbackPanda")
     $(feedbackButtonImage).css(imageCss)
     $(feedbackButton).css(buttonCss)

     feedbackButton.appendChild(feedbackButtonImage);
     if (type == 'class-list') {
       $(feedbackButton).appendTo($(element).find("td:nth-last-child(2)"))
     }

     $(element).removeClass (function (index, className) {
       return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
     });
     $(element).addClass("fbp-anchor-"+hash)


     feedbackButton.addEventListener("click", ()=>{
       // Inject local code so we can read the student and course data. This
       // gets evaluated within the scope of the user page, so special care was
       // taken to ONLY read these data points in a non-intrusive way. They
       // are reported back to the extension through a css class on the panda button

       var injectionforVIPX = ''

       if (type == 'class-list') {
         injectionforVIPX = `
           try {
             var vue_instance0 = document.querySelectorAll("div.my-class");
             var vue_instance = null;
             if (vue_instance0 && vue_instance0.length > 0) { vue_instance = vue_instance0[0].__vue__}
             var tableData = vue_instance.scheduleData[${data}]
             tableData.teacherId = vue_instance.userInfo.id;
             var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(tableData))))
             var attachedButton = document.getElementsByClassName("fbp-attached-button-${hash}")[0]
             if (attachedButton.classList)
               attachedButton.classList.add('fbp-tx-'+tx_payload);
             else
               attachedButton.className += ' ' + 'fbp-tx-'+tx_payload;
           } catch (e) {
             console.log('FeedbackPanda ran into an error finding important data', e)
           }`;
       }

       var script = document.createElement('script');
       var code = document.createTextNode('(function() {' + injectionforVIPX + '})();');
       script.appendChild(code);
       (document.body || document.head).appendChild(script);

       // Read out the result of the injection and add to data
       let message = null
       $(feedbackButton).attr("class").split(" ").forEach((v) => {
         if(v.indexOf("fbp-tx-")>-1) {
           var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
           try {
             if (type == 'class-list') {
               message = {
                 school: 'vipx',
                 student_id: res.student_id.toString(),
                 course_id: res.course_id.toString(),
                 classroom_id: res.classroom_id.toString(),
                 student_suggested_name: res.student.enname,
                 course_suggested_name: res.course.title_en,
                 meta_data: {
                   collector: version,
                   teacher: res.teacherId
                 },
                 custom_data: {
                   student_gender: res.student.sex,
                   schedule: {
                     time: res.start_at
                   },
                   course: res.course,
                   student: res.student,
                   status: res.course.status
                 }
               }
             }

           } catch (e) {
             console.log("FeedbackPanda ran into an error extracting data", e)
           }
         }
       })
       // console.log("FBP Message is", message)
       if (message) {
         console.log("String length pre",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length, message)
         message = removeVerboseDataFromMessage(message)
         console.log("String length post",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
         chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
       }
       return true;
     })
   }

   var attachButtonsForVIPXPopup = function (element, buttonCss, imageCss){
     let feedbackButton = document.createElement("button");
     let feedbackButtonImage = document.createElement("img");
     let hash = Math.ceil(Math.random()*1000000000).toString()

     $(feedbackButtonImage).attr("src", pandaImage)
     $(feedbackButton).addClass("fbp-attached-button").addClass("fbp-attached-button-"+hash).attr("title", "Open with FeedbackPanda")
     $(feedbackButtonImage).css(imageCss)
     $(feedbackButton).css(buttonCss)

     feedbackButton.appendChild(feedbackButtonImage);
      $(feedbackButton).prependTo($(element))

     $(element).removeClass (function (index, className) {
       return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
     });
     $(element).addClass("fbp-anchor-"+hash)


     feedbackButton.addEventListener("click", ()=>{
       // Inject local code so we can read the student and course data. This
       // gets evaluated within the scope of the user page, so special care was
       // taken to ONLY read these data points in a non-intrusive way. They
       // are reported back to the extension through a css class on the panda button

       var injectionforVIPX = ''

       injectionforVIPX = `
         try {
           var vue_instance0 = document.querySelectorAll("div.my-class");
           var vue_instance1 = document.querySelectorAll("div.newFeedbackBox")[0].parentElement.__vue__;
           var sched_id = vue_instance1.scheduleId;
           var vue_instance = null;
           if (vue_instance0 && vue_instance0.length > 0) { vue_instance = vue_instance0[0].__vue__}
           var correct_item = vue_instance.scheduleData.filter((i)=>{
             return i.id==sched_id;
           })[0];
           console.log(sched_id, correct_item, vue_instance)
           var tableData = correct_item;
           tableData.teacherId = vue_instance.userInfo.id;
           var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(tableData))))
           var attachedButton = document.getElementsByClassName("fbp-attached-button-${hash}")[0]
           if (attachedButton.classList)
             attachedButton.classList.add('fbp-tx-'+tx_payload);
           else
             attachedButton.className += ' ' + 'fbp-tx-'+tx_payload;
         } catch (e) {
           console.log('FeedbackPanda ran into an error finding important data', e)
         }`;

       var script = document.createElement('script');
       var code = document.createTextNode('(function() {' + injectionforVIPX + '})();');
       script.appendChild(code);
       (document.body || document.head).appendChild(script);

       // Read out the result of the injection and add to data
       let message = null
       $(feedbackButton).attr("class").split(" ").forEach((v) => {
         if(v.indexOf("fbp-tx-")>-1) {
           var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
           try {
               message = {
                 school: 'vipx',
                 student_id: res.student_id.toString(),
                 course_id: res.course_id.toString(),
                 classroom_id: res.classroom_id.toString(),
                 student_suggested_name: res.student.enname,
                 course_suggested_name: res.course.title_en,
                 meta_data: {
                   collector: version,
                   teacher: res.teacherId
                 },
                 custom_data: {
                   student_gender: res.student.sex,
                   schedule: {
                     time: res.start_at
                   },
                   course: res.course,
                   student: res.student,
                   status: res.course.status
                 }
               }

           } catch (e) {
             console.log("FeedbackPanda ran into an error extracting data", e)
           }
         }
       })
       // console.log("FBP Message is", message)
       if (message) {
         console.log("String length pre",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length, message)
         message = removeVerboseDataFromMessage(message)
         console.log("String length post",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
         chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
       }
       return true;
     })
   }

  // Attach Button to specific element on Landi English
  var attachButtonToElementForLandi = function (type, element, data, buttonCss, imageCss){
    let feedbackButton = document.createElement("button");
    let feedbackButtonImage = document.createElement("img");
    feedbackButton.appendChild(feedbackButtonImage);
    element.appendChild(feedbackButton);
    $(feedbackButtonImage).attr("src", pandaImage)
    $(feedbackButton).addClass("fbp-attached-button")
    $(feedbackButtonImage).css(imageCss)
    $(feedbackButton).css(buttonCss)

    let message = null;
    feedbackButton.addEventListener("click", ()=>{

      // Inject local code so we can read the data for this lesson. This
      // gets evaluated within the scope of the user page, so special care was
      // taken to ONLY read these two data points in a non-intrusive way. They
      // are reported back to the extension through css classes on the panda button

      var injectionForLandi = ''

      if (type == 'normal') {
        injectionForLandi = `
          try {
            var vue_instance = $(".app-container .content .class-body .container:not('.hidden')")[0].__vue__
            var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(vue_instance.classDetail))))
            $(".fbp-attached-button").addClass('fbp-tx-'+tx_payload)
          } catch (e) {
            console.log('FeedbackPanda ran into an error finding important data', e)
          }`;
      }

      if (type == 'monthly') {
        injectionForLandi = `
          try {
            var vue_instance = $(".app-container .content .class-body .month-memo")[0].__vue__
            var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(vue_instance.classDetail))))
            $(".fbp-attached-button").addClass('fbp-tx-'+tx_payload)

          } catch (e) {
            console.log('FeedbackPanda ran into an error finding important data',e)
          }`;

      }
      var script = document.createElement('script');
      var code = document.createTextNode('(function() {' + injectionForLandi + '})();');
      script.appendChild(code);
      (document.body || document.head).appendChild(script);

      // Read out the result of the injection and add to data
      $(feedbackButton).attr("class").split(" ").forEach((v) => {
        if(v.indexOf("fbp-tx-")>-1) {
          var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))

          // find correct student for the memo clicked.
          var student = res.stds.find((a)=>{return a.sid==data.student_id}) || {
            sname: data.student_name,
            sid: data.student_id
          }

          try {
            message = {
              school: 'landi_english',
              student_id: student.sid.toString(),
              course_id: res.mid.toString(),
              classroom_id: res.id.toString(),
              student_suggested_name: student.sname,
              course_suggested_name: res.materials.name,
              meta_data: {
                collector: version,
                teacher: res.teacher.id
              },
              custom_data: {
                schedule: {
                  ts: res.begin_time,
                },
                data:  res
              }
            }
          } catch (e) {
            console.log("FeedbackPanda ran into an error extracting data", e)
          }
          // console.log("FBP Message",message)
          // Then send the data out to FBP
          if (message) {
            chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
          }
        }
      })
    })
  }

  // Attach Button to specific element on iTutorGroup
  /*
   * DEPRECATED!
  var attachButtonToElementForiTutor = function (type, element, data, buttonCss, imageCss) {
    // Set a random hash to the FeedbackPanda button as a class name
    // to prevent stale buttons to open old data after the iTutor page might
    // have already loaded new data in an asynchronous fashion. It also allows
    // us to later inject hash-specific code to target that element and just
    // that element.
    let hash = Math.ceil(Math.random() * 1000000000).toString()

    // Create the FeedbackPanda button
    let fbpBtn = document.createElement('button')
    let fbpImg = document.createElement('img')

    fbpBtn.classList.add('fbp-attached-button', 'fbp-attached-button-' + hash)
    fbpBtn.title = 'Open with FeedbackPanda'
    fbpImg.src = pandaImage
    fbpBtn.appendChild(fbpImg)
    element.appendChild(fbpBtn)

    fbpBtn.addEventListener('click', ()=>{
      let message = null
    })
    }
    */

    // Attach Button to specific element on VIPKID
    //
    // We add a random hash to the FeedbackPanda button as a class name
    // to prevent stale buttons to open old data after the VIPKID page might
    // have already loaded new data in an asynchronous fashion. It also allows
    // us to later inject hash-specific code to target that element and just
    // that element.
    var attachButtonToElementForVIPKID = function (type, element, data, buttonCss, imageCss){
      let feedbackButton = document.createElement("button");
      let feedbackButtonImage = document.createElement("img");
      let hash = Math.ceil(Math.random()*1000000000).toString()

      $(feedbackButtonImage).attr("src", pandaImage)
      $(feedbackButton).addClass("fbp-attached-button").addClass("fbp-attached-button-"+hash).attr("title", "Open with FeedbackPanda")
      $(feedbackButtonImage).css(imageCss)
      $(feedbackButton).css(buttonCss)

      feedbackButton.appendChild(feedbackButtonImage);
      if (type == 'classlist-international') {
        $(feedbackButton).insertAfter($(element).find("td:last .cell"))
      }
      if (type == 'new-classlist') {
        $(feedbackButton).insertAfter($(element).find("td:last .cell"))
      }
      if (type == 'normal') {
        $(feedbackButton).insertBefore($(element).find("td:last a:first"))
      }

      $(element).removeClass (function (index, className) {
        return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
      });
      $(element).addClass("fbp-anchor-"+hash)


      feedbackButton.addEventListener("click", ()=>{
        // Inject local code so we can read the student and course data. This
        // gets evaluated within the scope of the user page, so special care was
        // taken to ONLY read these data points in a non-intrusive way. They
        // are reported back to the extension through a css class on the panda button

        var injetionforVIPKID = ''

        if (type == 'normal') {
          injetionforVIPKID = `
            try {
              var vue_instance = $(".fbp-anchor-${hash}")[0].__vue__
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(vue_instance.infoData))))
              $(".fbp-attached-button-${hash}").addClass('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        // In the class list, we have a somewhat SPA-like feature, loading tabs
        // and their respective data when they're visible. We check for which table
        // is visible and then extract the data from the instance, picking the
        // correct index in the array.
        if (type == 'new-classlist') {
          injetionforVIPKID = `
            try {
              var vue_instance0 = document.querySelectorAll("div.all-classroom-list .vip-table");
              var vue_instance1 = document.querySelectorAll("div.classroom-list .vip-table");
              var vue_instance2 = document.querySelectorAll("div.vip-tab-pane:not([aria-hidden=true]) .vip-table");
              var vue_instance = null;
              if (vue_instance0 && vue_instance0.length > 0) { vue_instance = vue_instance0[0].__vue__}
              if (vue_instance1 && vue_instance1.length > 0) { vue_instance = vue_instance1[0].__vue__}
              if (vue_instance2 && vue_instance2.length > 0) { vue_instance = vue_instance2[0].__vue__}
              var tableData = vue_instance.tableData[${data}]
              tableData.teacherId = document.getElementsByClassName("tp-header-wrapper")[0].__vue__.user.teacherId
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(tableData))))
              var attachedButton = document.getElementsByClassName("fbp-attached-button-${hash}")[0]
              if (attachedButton.classList)
                attachedButton.classList.add('fbp-tx-'+tx_payload);
              else
                attachedButton.className += ' ' + 'fbp-tx-'+tx_payload;
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        if (type == 'classlist-international') {
          injetionforVIPKID = `
            try {
              var vue_instance = document.querySelectorAll("div.vip-tab-pane:not([aria-hidden=true]) .vip-table")[0].__vue__
              var tableData = vue_instance.tableData[${data}]
              tableData.teacherId = document.getElementsByClassName("tp-header-wrapper")[0].__vue__.user.teacherId
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(tableData))))
              var attachedButton = document.getElementsByClassName("fbp-attached-button-${hash}")[0]
              if (attachedButton.classList)
                attachedButton.classList.add('fbp-tx-'+tx_payload);
              else
                attachedButton.className += ' ' + 'fbp-tx-'+tx_payload;
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        var script = document.createElement('script');
        var code = document.createTextNode('(function() {' + injetionforVIPKID + '})();');
        script.appendChild(code);
        (document.body || document.head).appendChild(script);

        // Read out the result of the injection and add to data
        let message = null
        $(feedbackButton).attr("class").split(" ").forEach((v) => {
          if(v.indexOf("fbp-tx-")>-1) {
            var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
            try {
              if (type == 'normal') {
                message = {
                  school: 'vipkid',
                  student_id: res.studentId.toString(),
                  course_id: res.lessonId.toString(),
                  classroom_id: res.id.toString(),
                  learning_cycle: res.learningCycleId.toString(),
                  student_suggested_name: res.englishName,
                  course_suggested_name: `${res.lessonSerialNumber}: ${res.lessonSerialName}`,
                  meta_data: {
                    collector: version,
                    teacher: res.teacherId
                  },
                  custom_data: {
                    schedule: {
                      ts: res.scheduledDateTimeL,
                      time: res.scheduledDateTime
                    },
                    course: {
                      number: res.lessonSerialNumber,
                      name: res.lessonSerialName,
                      id: res.lessonId
                    },
                    status: res.status,
                    finish_type: res.finishType,
                    is_short_notice: res.shortNotice,
                    is_interactive: res.interactiveTag || res.interactivePlusTag || res.interactionTag,
                    is_new_vipkid: res.isNewVipkid,
                    is_unit_assessment: res.isUnitAssessment
                  }
                }
              }

              if (type == 'new-classlist') {
                message = {
                  school: 'vipkid',
                  student_id: res.studentId.toString(),
                  course_id: res.lessonId.toString(),
                  classroom_id: (res.ocId||res.onlineClassId).toString(),
                  student_suggested_name: res.studentName,
                  course_suggested_name: `${res.lessonSN}: ${res.lessonName}`,
                  meta_data: {
                    collector: version,
                    teacher: res.teacherId
                  },
                  custom_data: {
                    student_gender: res.studentGender,
                    schedule: {
                      ts: res.scheduledTimestamp,
                      time: res.scheduledTime
                    },
                    course: {
                      type_id: res.courseId,
                      number: res.lessonSN,
                      name: res.lessonName,
                      id: res.lessonId,
                      version: res.lessonVersion
                    },
                    status: res.status,
                    finish_type: res.finishType,
                    is_short_notice: res.shortNotice,
                    is_interactive: res.interactiveTag || res.interactivePlusTag || (res.courseTagList && res.courseTagList.length ? (res.courseTagList.indexOf("INTERACTION")>-1 ? true : false) : false),
                  }
                }
              }

              if (type == 'classlist-international') {
                message = {
                  school: 'vipkid',
                  student_id: res.studentId.toString(),
                  course_id: res.lessonId.toString(),
                  classroom_id: res.id.toString(),
                  student_suggested_name: res.studentName,
                  course_suggested_name: `${res.lessonSN}: ${res.lessonName}`,
                  meta_data: {
                    collector: version,
                    teacher: res.teacherId
                  },
                  custom_data: {
                    student_gender: res.studentGender,
                    schedule: {
                      ts: res.scheduledTimestamp,
                      time: res.scheduledTime
                    },
                    course: {
                      type_id: res.courseId,
                      number: res.lessonSN,
                      name: res.lessonName,
                      id: res.lessonId,
                      version: res.lessonVersion
                    },
                    status: res.status,
                    finish_type: res.finishType,
                    is_short_notice: res.shortNotice,
                    is_interactive: res.interactiveTag || res.interactivePlusTag || (res.courseTagList && res.courseTagList.length ? (res.courseTagList.indexOf("INTERACTION")>-1 ? true : false) : false),
                  }
                }
              }
            } catch (e) {
              console.log("FeedbackPanda ran into an error extracting data", e)
            }
          }
        })
        // console.log("FBP Message is", message)
        if (message) {
          console.log("String length pre",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length, message)
          message = removeVerboseDataFromMessage(message)
          console.log("String length post",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
          chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
        }
        return true;
      })
    }

    // Attach Button to specific element on VIPKID in the classroom
    //
    // Here, we only add a single button.
    var attachButtonsForVIPKIDWarrior = function (type, element, data, buttonCss, imageCss){

      // Create the Button
      var feedbackButton = document.createElement("button");
      var feedbackButtonImage = document.createElement("img");
      feedbackButton.appendChild(feedbackButtonImage);
      document.body.appendChild(feedbackButton);

      // The panda image as a png, data url style
      $(feedbackButtonImage).attr("src", pandaImage)

      $(feedbackButtonImage).css({
        "height": "50px",
        "width": "50px"
      })

      var position_css = {}
      position_css = {
        "cursor": "pointer",
        "z-index": 10000,
        "position": "fixed",
        "right": "10px",
        "bottom": "10px",
        "border-radius": "5px",
        "font-family": "sans-serif",
        "color": "white",
        "background-color": "transparent",
        "box-shadow": "none",
        "text-shadow": "none",
        "outline": "none",
        "border": "none",
        "line-height": "50px",
        "padding": "5px"
      }


      $(feedbackButton).css(position_css)
      $(feedbackButton).addClass("fbp-attached-button")

      feedbackButton.addEventListener("click", ()=>{
        // Inject local code so we can read the student and course data. This
        // gets evaluated within the scope of the user page, so special care was
        // taken to ONLY read these data points in a non-intrusive way. They
        // are reported back to the extension through a css class on the panda button

        var injetionforVIPKID = ''

        if (type == 'normal') {
          injetionforVIPKID = `
            try {
              var vue_instance = document.getElementsByClassName("information-box")[0].__vue__
              var room_vue_instance = document.getElementsByClassName("room-box")[0].__vue__
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                student: vue_instance.studentInfo,
                class: vue_instance.lessonInfo,
                user: vue_instance.userId,
                room: room_vue_instance.classId,
                schedule: {
                  ts: room_vue_instance.courseStartTime
                }
              }))))
              document.getElementsByClassName("fbp-attached-button")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        // Due to some recursive properties in the data store, we need to clone
        // it, removing all recursion so that it can be stringified.
        if (type == 'aristotle') {
          injetionforVIPKID = `
            try {

              function isArrayLike(item) {
                if (Array.isArray(item)) return true;

                const len = item && item.length;
                return typeof len === 'number' && (len === 0 || (len - 1) in item) && typeof item.indexOf === 'function';
              }

              function fclone(obj, refs) {
                if (!obj || "object" !== typeof obj) return obj;

                if (obj instanceof Date) {
                  return new Date(obj);
                }

                if (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj)) {
                  return new Buffer(obj);
                }

                // typed array Int32Array etc.
                if (typeof obj.subarray === 'function' && /[A-Z][A-Za-z\d]+Array/.test(Object.prototype.toString.call(obj))) {
                  return obj.subarray(0);
                }

                if (!refs) { refs = []; }

                if (isArrayLike(obj)) {
                  refs[refs.length] = obj;
                  let l = obj.length;
                  let i = -1;
                  let copy = [];

                  while (l > ++i) {
                    copy[i] = ~refs.indexOf(obj[i]) ? '[Circular]' : fclone(obj[i], refs);
                  }

                  refs.length && refs.length--;
                  return copy;
                }

                refs[refs.length] = obj;
                let copy = {};

                if (obj instanceof Error) {
                  copy.name = obj.name;
                  copy.message = obj.message;
                  copy.stack = obj.stack;
                }

                let keys = Object.keys(obj);
                let l = keys.length;

                while(l--) {
                  let k = keys[l];
                  copy[k] = ~refs.indexOf(obj[k]) ? '[Circular]' : fclone(obj[k], refs);
                }

                refs.length && refs.length--;
                return copy;
              }

              var instance = document.getElementById("app").children[0].__vue__
              var state = fclone(document.getElementById("app").children[0].__vue__.$store.state)
              var room = state.room
              console.log("fbp room", state, room)
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                remoteUserInfo: room.remoteUserInfo,
                status: state.classstatus,
                info: {
                  studentDto: state.info.studentDto,
                  oc: state.info.oc,
                  teacherDto: state.info.teacherDto,
                  lessonDetail: state.info.lessonDetail
                },
                localUserInfo: room.remoteUserInfo,
                lessonInfo: room.lessonInfo,
                classInfo: room.classInfo
              }))))
              document.getElementsByClassName("fbp-attached-button")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        var script = document.createElement('script');
        var code = document.createTextNode('(function() {' + injetionforVIPKID + '})();');
        script.appendChild(code);
        (document.body || document.head).appendChild(script);
        // Read out the result of the injection and add to data
        let message = null
        $(feedbackButton).attr("class").split(" ").forEach((v) => {
          if(v.indexOf("fbp-tx-")>-1) {
            var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
            if (type == 'aristotle') {
              try {
                console.log('res is', res)

                let stu_id = (res.remoteUserInfo?res.remoteUserInfo.uid.toString():res.info.studentDto.id.toString()) || "Unknown"
                let cou_id = res.lessonInfo?res.lessonInfo.id.toString():res.info.lessonDetail.id.toString() || "Unknown"
                let cla_id = res.classInfo?res.classInfo.id.toString():res.info.oc.id.toString()
                let sugg_stu_name = res.remoteUserInfo?res.remoteUserInfo.nickName:res.info.studentDto.nickName||res.info.studentDto.englishName
                let sugg_cou_name = res.lessonInfo?`${res.lessonInfo.serialNumber}: ${res.lessonInfo.name}`:`${res.info.lessonDetail.serialNumber}: ${res.info.lessonDetail.name}`
                let tea_id = res.localUserInfo?res.localUserInfo.uid.toString():res.info.teacherDto.id.toString()
                let stu_gender = (res.remoteUserInfo?(res.remoteUserInfo.gender == "1" ? "MALE" : "FEMALE"):res.info.studentDto.gender)
                let cou_interactive = (res.classInfo?res.classInfo.curriculumVersion:res.info.lessonDetail.curriculumVersion) == "2"
                let cou_data = {
                  number: res.classInfo?res.classInfo.serialNumber:res.info.lessonDetail.serialNumber,
                  name: res.classInfo?res.classInfo.name:res.info.lessonDetail.name,
                  id: res.classInfo?res.classInfo.id:res.info.lessonDetail.id,
                  raw: res.classInfo?res.classInfo:res.info.lessonDetail
                }
                let stu_data = res.remoteUserInfo || res.info.studentDto
                let cla_status = res.status.finishClassStatus || res.status.currentClassStatus
                let cla_time = res.classInfo?res.classInfo.scheduledDateTime:{}
                message = {
                  school: 'vipkid',
                  student_id: stu_id,
                  course_id: cou_id,
                  classroom_id: cla_id,
                  student_suggested_name: sugg_stu_name,
                  course_suggested_name: sugg_cou_name,
                  meta_data: {
                    collector: version,
                    teacher: tea_id
                  },
                  custom_data: {
                    student_gender: stu_gender,
                    is_interactive: cou_interactive,
                    schedule: {
                      time: cla_time
                    },
                    course: cou_data,
                    student: stu_data,
                    status: cla_status
                  }
                }
              } catch (e) {
                console.log("FeedbackPanda ran into an error extracting data", e)
              }
            }
            if (type == 'normal') {
              try {
                message = {
                  school: 'vipkid',
                  student_id: res.student.uid.toString(),
                  course_id: res.class.id.toString(),
                  classroom_id: res.room.toString(),
                  student_suggested_name: res.student.nickName,
                  course_suggested_name: `${res.class.serialNumber}: ${res.class.name}`,
                  meta_data: {
                    collector: version,
                    teacher: res.user
                  },
                  custom_data: {
                    schedule: {
                      ts: res.schedule.ts,
                      time: res.scheduledDateTime
                    },
                    course: {
                      number: res.class.serialNumber,
                      name: res.class.serialName,
                      id: res.class.id,
                      raw: res.class
                    },
                    student: res.student,
                    status: res.status
                  }
                }
              } catch (e) {
                console.log("FeedbackPanda ran into an error extracting data", e)
              }
            }
          }
        })
        // console.log("FBP Message is", message)
        if (message) {
          console.log("String length pre",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
          message = removeVerboseDataFromMessage(message)
          console.log("String length post", btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length, message)
          chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
        }
        return true;
      })
    }

    // Attach Button to specific element on gogokid
    let attachButtonToElementForGogokid = function (type, element, index, buttonCss, imageCss){
      let feedbackButton = document.createElement("button");
      let feedbackButtonImage = document.createElement("img");
      let hash = Math.ceil(Math.random()*1000000000).toString()

      feedbackButton.appendChild(feedbackButtonImage);

      if (type == 'ex') {
        // Add to overlay, in the top left corner
        $(".ex-dialog-title", $(element)).prepend(feedbackButton)
        $(element).removeClass (function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      if (type == 'normal') {
        // Add to overlay, in the top left corner
        $(".evaluation-normal-pop-head", $(element)).prepend(feedbackButton)
        $(element).removeClass (function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      if (type == 'list') {
        // add to table row, in the last cell, append to the
        // first div found, which will be the actions
        $(element).find("td:last div:first").prepend($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      if (type == 'upcoming') {
        $(element).append($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      if (type == 'home-upcoming') {
        $(element).append($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }
      if (type == 'home-evaluation') {
        $(element).append($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      if (type == 'student-evaluation') {
        $(element).prepend($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      if (type == 'evaluation') {
        $(element).append($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      $(feedbackButtonImage).attr("src", pandaImage)
      $(feedbackButton).addClass("fbp-attached-button").addClass("fbp-attached-button-"+hash).attr("title", "Open with FeedbackPanda")
      $(feedbackButtonImage).css(imageCss)
      $(feedbackButton).css(buttonCss)

      if (type == 'list' && $(feedbackButton).is(':first-child')) {
        $(feedbackButton).css("margin-left", 0)
      }

      feedbackButton.addEventListener("click", ()=>{
        // Inject local code so we can read the student and course data. This
        // gets evaluated within the scope of the user page, so special care was
        // taken to ONLY read these data points in a non-intrusive way. They
        // are reported back to the extension through a css class on the panda button

        var injectionForGogokid = ''

        if (type == 'list') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = document.getElementsByClassName("my-history-table")[0].__vue__
              var relevant_item = vue_instance.tableData[${index}]
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(relevant_item, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        if (type == 'upcoming') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = document.getElementsByClassName("upcoming-classes-wrapper")[0].__vue__
              var relevant_item = vue_instance.collection[${index}]
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(relevant_item, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }
        if (type == 'home-upcoming') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = JSON.parse(JSON.stringify(document.getElementsByClassName("upcoming-wrap")[0].__vue__.comingCourse[${index}]))
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(vue_instance, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        if (type == 'home-evaluation') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = JSON.parse(JSON.stringify(document.getElementsByClassName("evaluation-wrap")[0].__vue__.comingCourse[${index}]))
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(vue_instance, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        if (type == 'evaluation') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = document.getElementsByClassName("evaluation-list-wrapper")[0].__vue__
              var relevant_item = vue_instance.collection[${index}]
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(relevant_item, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        if (type == 'normal') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = document.getElementsByClassName("my-history")[0].__vue__
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(vue_instance.showData, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        if (type == 'student-evaluation') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = document.getElementsByClassName("student-evaluation")[0].__vue__
              let data = {}
              data = vue_instance.baseInfo
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign({}, data, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        if (type == 'ex') {
          injectionForGogokid = `
            try {
              var user_vue_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = document.getElementsByClassName("my-history")[0].__vue__
              var class_id = document.getElementsByClassName("evaluation-dialog")[0].__vue__.$parent.$parent.classId
              let data = {}
              for (var i = 0; i < vue_instance.dataSource.length; i++) {
                if (vue_instance.dataSource[i].class_id_str == class_id) {
                  data = vue_instance.dataSource[i]
                }
              }
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign({}, data, {user: user_vue_instance.userInfo})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        var script = document.createElement('script');
        var code = document.createTextNode('(function() {' + injectionForGogokid + '})();');
        script.appendChild(code);
        (document.body || document.head).appendChild(script);

        // Read out the result of the injection and add to data
        let message = null
        $(feedbackButton).attr("class").split(" ").forEach((v) => {
          if(v.indexOf("fbp-tx-")>-1) {
            var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
            try {
              message = {
                school: 'gogokid',
                student_id: res.student_info.student_id.toString() || res.student_info.nickname+"-"+res.student_info.birthday,
                course_id: res.lesson.lesson_id.toString(),
                classroom_id: res.class_id.toString(),
                student_suggested_name: res.student_info.nickname,
                course_suggested_name: res.lesson.lesson_title,
                meta_data: {
                  collector: version,
                  teacher: res.user.teacher_uid
                },
                custom_data: {
                  schedule: {
                    ts: res.begin_time,
                    ts_end: res.end_time
                  },
                  course:  $().extend({}, (res.lesson || {}), {ppts: []}), // remove gigantic ppts array
                  student: res.student_info,
                  status: res.status,
                  prepare_status: res.prepare_status,
                  homework_status: res.homework_status,
                  can_cancel: res.can_cancel,
                  history: res.history
                }
              }
            } catch (e) {
              console.log("FeedbackPanda ran into an error extracting data", e)
            }
          }
        })
        console.log("FBP Message is", message)
        if (message) {
          chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
        }
        return true;
      })
    }

    /*
    gogokid Parent Feedback export.

    This works slightly different than the normal panda buttons. Here, we try and
    extract a LOT of information at the same time and send that over as a list.
    For gogokid in particular, we also want the Chinese->English translations,
    for which we need to automatically click a number of links.
     */
    var attachButtonsForGogoKidParentEvaluation = function() {

      var evaluationContainer = $(".parent-evaluation")
      var prevButton = $(".fbp-attached-button")

      if (!evaluationContainer.length || prevButton.length) {
        return
      }

      console.log("Attaching Gogokid Parent Feedback Extraction")

      // Create the Button
      var feedbackButton = document.createElement("button");
      var feedbackButtonImage = document.createElement("img");
      var feedbackButtonText = document.createElement("span");
      feedbackButtonText.innerHTML = "Loading…"
      feedbackButtonText.title = "This will open a new browser tab, importing all Parent Feedback items on this page"
      feedbackButton.appendChild(feedbackButtonText);
      feedbackButton.appendChild(feedbackButtonImage);
      document.body.appendChild(feedbackButton);
      $(feedbackButtonText).addClass("fbp-item-count")

      var loadingTranslations = false;

      let buttonTitleInterval = setInterval(()=>{

        if ($(".fbp-attached-button").length == 0) {
          console.log("Cancelling Button Title Interval")
          return clearInterval(buttonTitleInterval)
        }

        var inj = ''

        inj = `
          try {
            var vue_instance = document.getElementsByClassName("parent-evaluation")[0].__vue__
            var count = 0;
            if (vue_instance && vue_instance.evaluationList && vue_instance.evaluationList.length) {
              count = vue_instance.evaluationList.length;
            }
            if (count < 1) {
              document.getElementsByClassName("fbp-item-count")[0].innerHTML = "Please wait…"
            } else {
              document.getElementsByClassName("fbp-item-count")[0].innerHTML = "Sync "+count+" items to FBP"
            }

          } catch (e) {
            console.log('FeedbackPanda ran into an error finding important data', e)
          }`;

        var script = document.createElement('script');
        var code = document.createTextNode('(function() {' + inj + '})();');
        script.appendChild(code);
        (document.body || document.head).appendChild(script);

        setTimeout(()=>{
          (document.body || document.head).removeChild(script);
        }, 250)

        if (loadingTranslations) {
          $(document.getElementsByClassName("fbp-item-count")).html("Loading Translations…");
        } else {

        if (localCache.previouslySubmitted && localCache.previouslySubmitted.length && localCache.previouslySubmitted.indexOf($(".class-id").map((i,a)=>{return parseInt($(a).text().replace(/\D*/g, ''),10)}).get()[0])<0) {
          localCache.previouslySubmitted = []
        }

        var parentFeedbackItems = document.getElementsByClassName("fbp-item-count")[0].innerHTML.match(/\d+/)
        if (parentFeedbackItems && parentFeedbackItems.length) {parentFeedbackItems = parseInt(parentFeedbackItems[0], 10)}
        if (localCache && localCache.previouslySubmitted && localCache.previouslySubmitted.length) {
          var previouslySubmitted = localCache.previouslySubmitted.length;
          $(document.getElementsByClassName("fbp-item-count")).html("Sync "+(Math.max(parentFeedbackItems-previouslySubmitted, 0))+" items to FBP (already sent "+previouslySubmitted+")");
        }
      }

      }, 500)

      // The panda image as a png, data url style
      $(feedbackButtonImage).attr("src", pandaImage)

      $(feedbackButtonImage).css({
        "height": "50px",
        "width": "50px"
      })

      $(feedbackButtonText).css({
        "color": "#525252",
        "height": "30px",
        "line-height": "30px",
        "font-size": "13px",
        "border-radius": "15px",
        "padding": "0 15px",
        "background-color": "white",
        "border": "1px solid #dcdfe6",
        "margin-right": "5px",
        "display": "block",
        "float": "left",
        "margin-top": "10px"
      })

      var position_css = {}

      position_css = {
        "cursor": "pointer",
        "z-index": 10000,
        "position": "fixed",
        "right": "10px",
        "bottom": "10px",
        "border-radius": "5px",
        "font-family": "sans-serif",
        "color": "white",
        "background-color": "transparent",
        "box-shadow": "none",
        "text-shadow": "none",
        "outline": "none",
        "border": "none",
        "line-height": "50px",
        "padding": "5px"
      }


      $(feedbackButton).css(position_css)
      $(feedbackButton).addClass("fbp-attached-button")

      feedbackButton.addEventListener("click", ()=>{
        // Inject local code so we can read the student and course data. This
        // gets evaluated within the scope of the user page, so special care was
        // taken to ONLY read these data points in a non-intrusive way. They
        // are reported back to the extension through a css class on the panda button

        // Here we click each untranslated evaluation text, so it gets translated.
        function clickButtons(){
          $(".evaluation-text:not(.translated) .btn-translate").each((i, e)=>{
            $(e)[0].click()
          })
        }

        function areTranslationsFinished(){
          return $(".evaluation-item .evaluation-text").length == $(".evaluation-text.translated").length
        }

        loadingTranslations = true;
        clickButtons()

        var forceSend = false;
        var forceTimeout = setTimeout(()=>{
          forceSend = true;
        }, 5000)

        var finishedCheck = setInterval(()=>{
          if (forceSend || areTranslationsFinished()) {
            clearInterval(finishedCheck)
            clearTimeout(forceTimeout)
            loadingTranslations = false;
            extractAndSendParentFeedback()
          }
        }, 500)


        function extractAndSendParentFeedback (){

          var injetionforVIPKID = ''

          injetionforVIPKID = `
            try {
              var vue_teacher_instance = document.getElementsByClassName("main-container")[0].__vue__
              var vue_instance = document.getElementsByClassName("parent-evaluation")[0].__vue__
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                data: vue_instance.evaluationList,
                teacher: vue_teacher_instance.teacher_uid
              }))))
              document.getElementsByClassName("fbp-attached-button")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;

          var script = document.createElement('script');
          var code = document.createTextNode('(function() {' + injetionforVIPKID + '})();');
          script.appendChild(code);
          (document.body || document.head).appendChild(script);

          // Read out the result of the injection and add to data
          let message = null
          $(feedbackButton).attr("class").split(" ").forEach((v) => {
            if(v.indexOf("fbp-tx-")>-1) {
              var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
              try {

                // remove previously sent items from data
                var d = res.data

                if (localCache && localCache.previouslySubmitted) {
                  d = d.filter((i)=>{return localCache.previouslySubmitted.indexOf(i.id) < 0})
                }

                if (d.length > 50) {
                  d = d.splice(-50)
                  if (!confirm("FeedbackPanda Browser Extension:\n\nToo many items to send at once. FeedbackPanda will now transfer the last 50 items. Please click the Sync button again to transfer more items after they have been imported.")){
                    return
                  }
                }

                ids = d.map(i => i.class_id)

                localCache.previouslySubmitted = unique(Array.prototype.concat.apply((localCache.previouslySubmitted || []), ids))

                message = {
                  school: 'gogokid',
                  ingress_type: 'parent-reports',
                  parent_feedback: d,
                  meta_data: {
                    collector: version,
                    teacher: res.teacher
                  },
                  custom_data: {
                  }
                }

                console.log(message)
              } catch (e) {
                console.log("FeedbackPanda ran into an error extracting data", e)
              }
            }
          })
          if (message) {
            console.log("String length pre",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
            message = removeVerboseDataFromMessage(message)
            console.log("String length post",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
            chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
          }
          return true;

        }

      })


    }

    // Attach Button to specific element on gogokid
    let attachButtonToElementForHujiang = function (type, element, index, buttonCss, imageCss){
      let feedbackButton = document.createElement("button");
      let feedbackButtonImage = document.createElement("img");
      let hash = Math.ceil(Math.random()*1000000000).toString()

      feedbackButton.appendChild(feedbackButtonImage);

      if (type == 'schedule') {
        $("td:nth-last-child(2)", element).prepend($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      if (type == 'feedback') {
        $(element).append($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      $(feedbackButtonImage).attr("src", pandaImage)
      $(feedbackButton).addClass("fbp-attached-button").addClass("fbp-attached-button-"+hash).attr("title", "Open with FeedbackPanda")
      $(feedbackButtonImage).css(imageCss)
      $(feedbackButton).css(buttonCss)

      // if (type == 'list' && $(feedbackButton).is(':first-child')) {
      //   $(feedbackButton).css("margin-left", 0)
      // }

      feedbackButton.addEventListener("click", ()=>{
        // Inject local code so we can read the student and course data. This
        // gets evaluated within the scope of the user page, so special care was
        // taken to ONLY read these data points in a non-intrusive way. They
        // are reported back to the extension through a css class on the panda button

        var injectionForHujiang = ''

        if (type == 'schedule') {
          injectionForHujiang = `
            try {
              var scope = angular.element($(".ms-view .table-responsive table tbody tr")[${index}]).scope().schedule
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign({}, scope)))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }
        if (type == 'feedback') {
          injectionForHujiang = `
            try {
              var scope = angular.element($("#comment")).scope()
              var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign({}, {schedule:scope.schedule, data: scope.data})))))
              document.getElementsByClassName("fbp-attached-button-${hash}")[0].classList.add('fbp-tx-'+tx_payload)
            } catch (e) {
              console.log('FeedbackPanda ran into an error finding important data', e)
            }`;
        }

        var script = document.createElement('script');
        var code = document.createTextNode('(function() {' + injectionForHujiang + '})();');
        script.appendChild(code);
        (document.body || document.head).appendChild(script);

        // Read out the result of the injection and add to data
        let message = null
        $(feedbackButton).attr("class").split(" ").forEach((v) => {
          if(v.indexOf("fbp-tx-")>-1) {
            var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
            try {
              if (type == "schedule") {
                message = {
                  school: 'hujiang',
                  student_id: res.menteeId.toString(),
                  course_id: res.reservationLessinId.toString(),
                  classroom_id: res.scheduleId.toString(),
                  student_suggested_name: res.menteeName,
                  course_suggested_name: res.reservationLessonName,
                  meta_data: {
                    collector: version,
                    teacher: res.teacherId
                  },
                  custom_data: {
                    schedule: {
                      time: res.beginTime,
                      time_end: res.endTime
                    },
                    raw: res
                  }
                }
              }

              if (type == "feedback") {
                message = {
                  school: 'hujiang',
                  student_id: res.data.menteeId.toString(),
                  course_id: res.data.lessonId.toString(),
                  classroom_id: res.data.scheduleId.toString(),
                  student_suggested_name: res.data.menteeName,
                  course_suggested_name: res.data.lessonName,
                  meta_data: {
                    collector: version
                  },
                  custom_data: {
                    schedule: {
                      time: res.data.beginTime,
                      time_end: res.data.endTime
                    },
                    raw: res
                  }
                }
              }
            } catch (e) {
              console.log("FeedbackPanda ran into an error extracting data", e)
            }
          }
        })
        console.log("FBP Message is", message)
        if (message) {
          chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
        }
        return true;
      })
    }

    // Attach Button to specific element on dadaabc
    let attachButtonToElementForDaDaABC = function (type, element, index, buttonCss, imageCss){

      let feedbackButton = document.createElement("button");
      let feedbackButtonImage = document.createElement("img");
      let hash = Math.ceil(Math.random()*1000000000).toString()

      feedbackButton.appendChild(feedbackButtonImage);

      if (type == 'classList') {
        $(element).find("td.classid").css("position", "relative").prepend($(feedbackButton))
        $(element).removeClass(function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)
      }

      $(feedbackButtonImage).attr("src", pandaImage)
      $(feedbackButton).addClass("fbp-attached-button").addClass("fbp-attached-button-"+hash).attr("title", "Open with FeedbackPanda")
      $(feedbackButtonImage).css(imageCss)
      $(feedbackButton).css(buttonCss)

      feedbackButton.addEventListener("click", ()=>{

        let student = $(element).find(".student a").text().match(/.*\)/g)[0].trim()
        let lesson_id = $(element).data("id").toString()
        let student_nickname = student.match(/^[^(]*/g)[0].trim()
        let student_name = student.match(/\([^\)]*/g)[0].trim().replace(/\(/g,'')
        let student_id = $(element).find(".student a").attr("href").match(/\d+$/g)[0]
        let course_id = $(element).find("td.topic span.course").text().trim()
        let course_name = course_id
        let status = $(element).find(".status").text()

        let message = null

        message = {
          school: 'dadaabc',
          student_id: student_id,
          course_id: course_id.toString().trim().toLowerCase().replace(/\s/g,'-'),
          classroom_id: lesson_id,
          student_suggested_name: student_name || student_nickname,
          student_suggested_nickname: student_nickname || student_name,
          course_suggested_name: course_name,
          meta_data: {
            collector: version,
          },
          custom_data: {
            status: status,
          }
        }
        if (message) {
          chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
        }
        return true;
      })
    }

    // MMears eval screen
   var attachButtonsForMmearsEval = function () {

      // Create the Button
      var feedbackButton = document.createElement("button");
      var feedbackButtonImage = document.createElement("img");
      feedbackButton.appendChild(feedbackButtonImage);
      document.body.appendChild(feedbackButton);

      // The panda image as a png, data url style
      $(feedbackButtonImage).attr("src", pandaImage)

      $(feedbackButtonImage).css({
        "height": "50px",
        "width": "50px"
      })

      var position_css = {}
      position_css = {
        "cursor": "pointer",
        "z-index": 10000,
        "position": "fixed",
        "right": "10px",
        "bottom": "10px",
        "border-radius": "5px",
        "font-family": "sans-serif",
        "color": "white",
        "background-color": "transparent",
        "box-shadow": "none",
        "text-shadow": "none",
        "outline": "none",
        "border": "none",
        "line-height": "50px",
        "padding": "5px"
      }


      $(feedbackButton).css(position_css)
      feedbackButton.addEventListener("click", ()=>{
        let message = null;
        try {
          let ts = window.location.href.match(/ts=\d+/);
          if (ts) {
            ts = ts[0].replace(/ts=/g, '')
          }
          message = {
            school: 'magicears',
            student_id: document.querySelectorAll("div[class^='student']")[0].querySelectorAll("p")[1].innerText,
            course_id: document.querySelectorAll("div[class^='course']")[0].querySelectorAll("p")[2].innerText,
            classroom_id: ts,
            student_suggested_name: document.querySelectorAll("div[class^='student']")[0].querySelectorAll("p")[0].innerText,
            course_suggested_name: `${document.querySelectorAll("div[class^='course']")[0].querySelectorAll("p")[2].innerText}: ${document.querySelectorAll("div[class^='course']")[0].querySelectorAll("p")[3].innerText}`,
            meta_data: {
              collector: version
            },
            custom_data: {
              seat: document.querySelectorAll("div[class^='course']")[0].querySelectorAll("p")[3].innerText,
              schedule: {
                ts: ts
              }
            }
          }
        } catch (e) {
          console.log("FeedbackPanda ran into an error extracting data", e)
        }
        // console.log("FBP Message is", message)
        if (message) {
          chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
        }
        return true;
      })
    }

    // Attach Button to specific element on VIPKID
    var attachButtonToElementForMmearsClasslist = function (type, element, data, buttonCss, imageCss){

      $(".student_detail .student-container", element).each((index,studentContainer)=>{
        let feedbackButton = document.createElement("button");
        let feedbackButtonImage = document.createElement("img");
        let hash = Math.ceil(Math.random()*1000000000).toString()
        feedbackButton.appendChild(feedbackButtonImage);

        $(feedbackButtonImage).attr("src", pandaImage)
        $(feedbackButton).addClass("fbp-attached-button").addClass("fbp-attached-button-"+hash).attr("title", "Open with FeedbackPanda")
        $(feedbackButtonImage).css(imageCss)
        $(feedbackButton).css(buttonCss)

        if (type == 'classlist') {
          $(studentContainer).find(".stu_name").prepend($(feedbackButton))
        }

        $(element).removeClass (function (index, className) {
          return (className.match (/(^|\s)fbp-anchor-\S+/g) || []).join(' ');
        });
        $(element).addClass("fbp-anchor-"+hash)

        feedbackButton.addEventListener("click", ()=>{
          let message = null
          try {
            if (type == 'classlist') {
              let ts = element.id

              let course = $(element).find(".level_unit_lesson .level").text() + "-" +
                $(element).find(".level_unit_lesson .unit").text() + "-" +
                $(element).find(".level_unit_lesson .lesson").text() || ""

              message = {
                school: 'magicears',
                student_id: $($(".stu_id",studentContainer)[0]).text(),
                course_id: course,
                classroom_id: ts,
                student_suggested_name: $($(".stu_name",studentContainer)[0]).text().match(/^[^(]+/)[0],
                course_suggested_name: `${course}`,
                meta_data: {
                  collector: version
                },
                custom_data: {
                  seat: $($(".stu_name",studentContainer)[0]).text().match(/Seat No\.\d+/)[0].replace(/Seat No\./g,''),
                  schedule: {
                    ts: ts
                  }
                }
              }

            }
          } catch (e) {
            console.log("FeedbackPanda ran into an error extracting data", e)
          }

          if (message) {
            chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
          }
          return true;
        })
      })


    }

  // Helper function to attach the buttons to the page globally for:
  // - VIPKID
  // - MagicEars
  // - ALO7
  var attachButtons = function (side) {

    // Create the Button
    var feedbackButton = document.createElement("button");
    var feedbackButtonImage = document.createElement("img");
    feedbackButton.appendChild(feedbackButtonImage);
    document.body.appendChild(feedbackButton);

    // The panda image as a png, data url style
    $(feedbackButtonImage).attr("src", pandaImage)

    $(feedbackButtonImage).css({
      "height": "50px",
      "width": "50px"
    })

    var position_css = {}
    if (side == 'left') {
      position_css = {
        "cursor": "pointer",
        "z-index": 10000,
        "position": "fixed",
        "left": "10px",
        "bottom": "10px",
        "border-radius": "5px",
        "font-family": "sans-serif",
        "color": "white",
        "background-color": "transparent",
        "box-shadow": "none",
        "text-shadow": "none",
        "outline": "none",
        "border": "none",
        "line-height": "50px",
        "padding": "5px"
      }
    } else {
      position_css = {
        "cursor": "pointer",
        "z-index": 10000,
        "position": "fixed",
        "right": "10px",
        "bottom": "10px",
        "border-radius": "5px",
        "font-family": "sans-serif",
        "color": "white",
        "background-color": "transparent",
        "box-shadow": "none",
        "text-shadow": "none",
        "outline": "none",
        "border": "none",
        "line-height": "50px",
        "padding": "5px"
      }
    }

    $(feedbackButton).css(position_css)
    feedbackButton.addEventListener("click", sendToContext)

  }

  // Old VIPKID classroom
  var attachButtonsForVIPKIDFlash = function (side) {

    // Create the Button
    var feedbackButton = document.createElement("button");
    var feedbackButtonImage = document.createElement("img");
    feedbackButton.appendChild(feedbackButtonImage);
    document.body.appendChild(feedbackButton);

    // The panda image as a png, data url style
    $(feedbackButtonImage).attr("src", pandaImage)

    $(feedbackButtonImage).css({
      "height": "50px",
      "width": "50px"
    })

    var position_css = {}

    position_css = {
      "cursor": "pointer",
      "z-index": 10000,
      "position": "fixed",
      "right": "10px",
      "bottom": "10px",
      "border-radius": "5px",
      "font-family": "sans-serif",
      "color": "white",
      "background-color": "transparent",
      "box-shadow": "none",
      "text-shadow": "none",
      "outline": "none",
      "border": "none",
      "line-height": "50px",
      "padding": "5px"
    }


    $(feedbackButton).css(position_css)
    $(feedbackButton).addClass("fbp-attached-button")

    feedbackButton.addEventListener("click", ()=>{
      // Inject local code so we can read the student and course data. This
      // gets evaluated within the scope of the user page, so special care was
      // taken to ONLY read these data points in a non-intrusive way. They
      // are reported back to the extension through a css class on the panda button

      var injetionforVIPKID = ''

      injetionforVIPKID = `
        try {
          var vue_instance = document.getElementsByClassName("classroom-wrapper")[0].__vue__
          var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify({
            student: vue_instance.student,
            student_id: vue_instance.studentId,
            class: vue_instance.classroomInfo,
            user: vue_instance.user.teacherId,
            classroom_id: vue_instance.classId,
            course_type: vue_instance.courseType,
            is_toefl: vue_instance.isToeflJunior,
            is_minor: vue_instance.isMinorCourses,
            is_trial: vue_instance.isNewTrail
          }))))
          document.getElementsByClassName("fbp-attached-button")[0].classList.add('fbp-tx-'+tx_payload)
        } catch (e) {
          console.log('FeedbackPanda ran into an error finding important data', e)
        }`;

      var script = document.createElement('script');
      var code = document.createTextNode('(function() {' + injetionforVIPKID + '})();');
      script.appendChild(code);
      (document.body || document.head).appendChild(script);

      // Read out the result of the injection and add to data
      let message = null
      $(feedbackButton).attr("class").split(" ").forEach((v) => {
        if(v.indexOf("fbp-tx-")>-1) {
          var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
          console.log('fbp res',res)
          try {
            message = {
              school: 'vipkid',
              student_id: res.student_id.toString(),
              course_id: res.class.lessonId.toString(),
              classroom_id: res.classroom_id.toString(),
              student_suggested_name: res.class.studentEnglishName,
              course_suggested_name: `${res.class.serialNumber}: ${res.class.lessonName}`,
              meta_data: {
                collector: version,
                teacher: res.user
              },
              custom_data: {
                schedule: {
                  ts: res.class.scheduleTime
                },
                course: {
                  number: res.class.serialNumber,
                  name: res.class.lessonName,
                  id: res.class.lessonId,
                  raw: res.class,
                  type: res.course_type,
                  is_toefl: res.is_toefl,
                  is_minor: res.is_minor,
                  is_trial: res.is_trial
                },
                student: res.student,
              }
            }
          } catch (e) {
            console.log("FeedbackPanda ran into an error extracting data", e)
          }
        }
      })
      // console.log("FBP Message is", message)
      if (message) {
        chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
      }
      return true;
    })
  }

  // VIPKID Parent Feedback extraction there

  var attachButtonsForVIPKIDParentFeedback = function() {

    console.log("Attaching Parent Feedback Extraction")

    // Create the Button
    var feedbackButton = document.createElement("button");
    var feedbackButtonImage = document.createElement("img");
    var feedbackButtonText = document.createElement("span");
    feedbackButtonText.innerHTML = "Loading…"
    feedbackButtonText.title = "This will open a new browser tab, importing all Parent Feedback items on this page"
    feedbackButton.appendChild(feedbackButtonText);
    feedbackButton.appendChild(feedbackButtonImage);
    document.body.appendChild(feedbackButton);
    $(feedbackButtonText).addClass("fbp-item-count")

    setInterval(()=>{
      var inj = ''

      inj = `
        try {
          var vue_instance = document.getElementsByClassName("parentsfeedback")[0].__vue__
          var count = 0;
          if (vue_instance && vue_instance.datas && vue_instance.datas.length) {
            count = vue_instance.datas.length;
          }
          if (count < 1) {
            document.getElementsByClassName("fbp-item-count")[0].innerHTML = "Please wait…"
          } else {
            document.getElementsByClassName("fbp-item-count")[0].innerHTML = "Sync "+count+" items to FBP"
          }

        } catch (e) {
          console.log('FeedbackPanda ran into an error finding important data', e)
        }`;

      var script = document.createElement('script');
      var code = document.createTextNode('(function() {' + inj + '})();');
      script.appendChild(code);
      (document.body || document.head).appendChild(script);

      // new number will be in the HTML
      // calculate the correct number that can be transferred
      var parentFeedbackItems = document.getElementsByClassName("fbp-item-count")[0].innerHTML.match(/\d+/)
      if (parentFeedbackItems && parentFeedbackItems.length) {parentFeedbackItems = parseInt(parentFeedbackItems[0], 10)}
      if (localCache && localCache.previouslySubmitted && localCache.previouslySubmitted.length) {
        var previouslySubmitted = localCache.previouslySubmitted.length;
        $(document.getElementsByClassName("fbp-item-count")).html("Sync "+(parentFeedbackItems-previouslySubmitted)+" items to FBP (already sent "+previouslySubmitted+")");
      }
    }, 500)

    // The panda image as a png, data url style
    $(feedbackButtonImage).attr("src", pandaImage)

    $(feedbackButtonImage).css({
      "height": "50px",
      "width": "50px"
    })

    $(feedbackButtonText).css({
      "color": "#525252",
      "height": "30px",
      "line-height": "30px",
      "font-size": "13px",
      "border-radius": "15px",
      "padding": "0 15px",
      "background-color": "white",
      "border": "1px solid #dcdfe6",
      "margin-right": "5px",
      "display": "block",
      "float": "left",
      "margin-top": "10px"
    })

    var position_css = {}

    position_css = {
      "cursor": "pointer",
      "z-index": 10000,
      "position": "fixed",
      "right": "10px",
      "bottom": "10px",
      "border-radius": "5px",
      "font-family": "sans-serif",
      "color": "white",
      "background-color": "transparent",
      "box-shadow": "none",
      "text-shadow": "none",
      "outline": "none",
      "border": "none",
      "line-height": "50px",
      "padding": "5px"
    }


    $(feedbackButton).css(position_css)
    $(feedbackButton).addClass("fbp-attached-button")

    feedbackButton.addEventListener("click", ()=>{
      // Inject local code so we can read the student and course data. This
      // gets evaluated within the scope of the user page, so special care was
      // taken to ONLY read these data points in a non-intrusive way. They
      // are reported back to the extension through a css class on the panda button

      var injetionforVIPKID = ''

      injetionforVIPKID = `
        try {
          var vue_instance = document.getElementsByClassName("parentsfeedback")[0].__vue__
          var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify({
            data: vue_instance.datas,
            teacher: vue_instance.teacherId,
            total: vue_instance.total
          }))))
          document.getElementsByClassName("fbp-attached-button")[0].classList.add('fbp-tx-'+tx_payload)
        } catch (e) {
          console.log('FeedbackPanda ran into an error finding important data', e)
        }`;

      var script = document.createElement('script');
      var code = document.createTextNode('(function() {' + injetionforVIPKID + '})();');
      script.appendChild(code);
      (document.body || document.head).appendChild(script);

      // Read out the result of the injection and add to data
      let message = null
      $(feedbackButton).attr("class").split(" ").forEach((v) => {
        if(v.indexOf("fbp-tx-")>-1) {
          var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
          try {

            // remove previously sent items from data
            var d = res.data

            if (localCache && localCache.previouslySubmitted) {
              d = d.filter((i)=>{return localCache.previouslySubmitted.indexOf(i.id) < 0})
            }

            if (d.length > 50) {
              d = d.splice(-50)
              if (!confirm("FeedbackPanda Browser Extension:\n\nToo many items to send at once. FeedbackPanda will now transfer the last 50 items. Please click the Sync button again to transfer more items after they have been imported.")){
                return
              }
            }

            ids = d.map(i => i.id)
            localCache.previouslySubmitted = Array.prototype.concat.apply((localCache.previouslySubmitted || []), ids)

            message = {
              school: 'vipkid',
              ingress_type: 'parent-reports',
              parent_feedback: d,
              meta_data: {
                collector: version,
                teacher: res.teacher
              },
              custom_data: {
                total: res.total
              }
            }
          } catch (e) {
            console.log("FeedbackPanda ran into an error extracting data", e)
          }
        }
      })
      if (message) {
        console.log("String length pre",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
        message = removeVerboseDataFromMessage(message)
        console.log("String length post",btoa(unescape(encodeURIComponent(JSON.stringify(message)))).length)
        chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
      }
      return true;
    })


  }

  // International VIPKID classroom
  var attachButtonsForVIPKIDInternational = function (side) {

    // Create the Button
    var feedbackButton = document.createElement("button");
    var feedbackButtonImage = document.createElement("img");
    feedbackButton.appendChild(feedbackButtonImage);
    document.body.appendChild(feedbackButton);

    // The panda image as a png, data url style
    $(feedbackButtonImage).attr("src", pandaImage)

    $(feedbackButtonImage).css({
      "height": "50px",
      "width": "50px"
    })

    var position_css = {}

    position_css = {
      "cursor": "pointer",
      "z-index": 10000,
      "position": "fixed",
      "right": "10px",
      "bottom": "10px",
      "border-radius": "5px",
      "font-family": "sans-serif",
      "color": "white",
      "background-color": "transparent",
      "box-shadow": "none",
      "text-shadow": "none",
      "outline": "none",
      "border": "none",
      "line-height": "50px",
      "padding": "5px"
    }


    $(feedbackButton).css(position_css)
    $(feedbackButton).addClass("fbp-attached-button")

    feedbackButton.addEventListener("click", ()=>{
      // Inject local code so we can read the student and course data. This
      // gets evaluated within the scope of the user page, so special care was
      // taken to ONLY read these data points in a non-intrusive way. They
      // are reported back to the extension through a css class on the panda button

      var injetionforVIPKID = ''

      injetionforVIPKID = `
        try {
          var vue_instance = document.getElementsByClassName("international-classroom-main-wrapper")[0].__vue__
          var tx_payload = btoa(unescape(encodeURIComponent(JSON.stringify({
            toc: vue_instance.tocInfo,
            class: vue_instance.classInfo,
            user: vue_instance.user.user,
            classroom_id: vue_instance.classId,
            lesson: vue_instance.lessonInfo
          }))))
          document.getElementsByClassName("fbp-attached-button")[0].classList.add('fbp-tx-'+tx_payload)
        } catch (e) {
          console.log('FeedbackPanda ran into an error finding important data', e)
        }`;

      var script = document.createElement('script');
      var code = document.createTextNode('(function() {' + injetionforVIPKID + '})();');
      script.appendChild(code);
      (document.body || document.head).appendChild(script);

      // Read out the result of the injection and add to data
      let message = null
      $(feedbackButton).attr("class").split(" ").forEach((v) => {
        if(v.indexOf("fbp-tx-")>-1) {
          var res = JSON.parse(decodeURIComponent(escape(atob(v.replace('fbp-tx-', '')))))
          console.log('fbp res',res)
          try {
            message = {
              school: 'vipkid',
              student_id: res.toc.studentId.toString(),
              course_id: res.toc.courseId.toString(),
              classroom_id: res.toc.id.toString(),
              student_suggested_name: res.toc.studentName,
              course_suggested_name: `${res.class.lessonSerialNumber}: ${res.class.lessonName}`,
              meta_data: {
                collector: version,
                teacher: res.user
              },
              custom_data: {
                schedule: {
                  ts: res.class.scheduledDateTime
                },
                course: {
                  number: res.class.lessonSerialNumber,
                  name: res.class.lessonName,
                  id: res.class.lessonId,
                  raw: res.class
                },
                misc: {
                  curriculumVersion: res.toc.curriculumVersion
                }
              }
            }
          } catch (e) {
            console.log("FeedbackPanda ran into an error extracting data", e)
          }
        }
      })
      // console.log("FBP Message is", message)
      if (message) {
        chrome.runtime.sendMessage({"message": "transmit_external_data", "url": window.location.href,  "data": message});
      }
      return true;
    })
  }

  // Check if we are on a supported site
  var fbp_pattern_main = /https?:\/\/.*\.feedbackpanda\.com/g
  var vipkid_pattern_main = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\//g
  var magicears_pattern_main = /https?:\/\/(t\.mmears\.com)\//g
  var alo7_pattern_main = /https:\/\/www\.aizhuanjiao\.com\//g
  var landi_english_pattern_main = /https:\/\/teacher\.landi\.com\/.*/g
  var itutorgroup_pattern_main = /https:\/\/consultant\.tutorabc\.com\/.*/g
  var itutorgroup_pattern_main_1 = /https:\/\/teach\.tutorabc\.com\.cn\/.*/g
  var gogokid_pattern_main = /https:\/\/teacher\.gogokid\.com\/.*/g
  var vipx_pattern_main = /https:\/\/.*\.vipx\.com\/.*/g
  var dadaabc_pattern_main = /https:\/\/www\.dadaabc\.com\/apps\/teacher\/.*/g
  var dadaabc_pattern_main = /https:\/\/www\.dadaabc\.com\/apps\/teacher\/.*/g
  var hujiang_pattern_main = /https:\/\/teacher\.hujiang\.com\/.*/g

  if (fbp_pattern_main.exec(window.location)) {
    // We are on FBP - just attach version to body as to communicate that the
    // extension is installed
    $("body").addClass(version)
  }

  // Start VIPKID detection
  /*
    VVVVVVVV           VVVVVVVVIIIIIIIIIIPPPPPPPPPPPPPPPPP   KKKKKKKKK    KKKKKKKIIIIIIIIIIDDDDDDDDDDDDD
    V::::::V           V::::::VI::::::::IP::::::::::::::::P  K:::::::K    K:::::KI::::::::ID::::::::::::DDD
    V::::::V           V::::::VI::::::::IP::::::PPPPPP:::::P K:::::::K    K:::::KI::::::::ID:::::::::::::::DD
    V::::::V           V::::::VII::::::IIPP:::::P     P:::::PK:::::::K   K::::::KII::::::IIDDD:::::DDDDD:::::D
    V:::::V           V:::::V   I::::I    P::::P     P:::::PKK::::::K  K:::::KKK  I::::I    D:::::D    D:::::D
    V:::::V         V:::::V    I::::I    P::::P     P:::::P  K:::::K K:::::K     I::::I    D:::::D     D:::::D
    V:::::V       V:::::V     I::::I    P::::PPPPPP:::::P   K::::::K:::::K      I::::I    D:::::D     D:::::D
    V:::::V     V:::::V      I::::I    P:::::::::::::PP    K:::::::::::K       I::::I    D:::::D     D:::::D
    V:::::V   V:::::V       I::::I    P::::PPPPPPPPP      K:::::::::::K       I::::I    D:::::D     D:::::D
    V:::::V V:::::V        I::::I    P::::P              K::::::K:::::K      I::::I    D:::::D     D:::::D
    V:::::V:::::V         I::::I    P::::P              K:::::K K:::::K     I::::I    D:::::D     D:::::D
    V:::::::::V          I::::I    P::::P            KK::::::K  K:::::KKK  I::::I    D:::::D    D:::::D
    V:::::::V         II::::::IIPP::::::PP          K:::::::K   K::::::KII::::::IIDDD:::::DDDDD:::::D
    V:::::V          I::::::::IP::::::::P          K:::::::K    K:::::KI::::::::ID:::::::::::::::DD
    V:::V           I::::::::IP::::::::P          K:::::::K    K:::::KI::::::::ID::::::::::::DDD
    VVV            IIIIIIIIIIPPPPPPPPPP          KKKKKKKKK    KKKKKKKIIIIIIIIIIDDDDDDDDDDDDD
  */

  if (vipkid_pattern_main.exec(window.location)) {
    let checkInterval = null
    // We are on VIPKID

    // https://t.vipkid.com.cn/tp/classrooms/international/71981?scheduledDateTime=1542416400000&channel=82&lessonId=597770&studentId=12330378&curriculumVersion=1001&onlineClassId=71981
    var vipkid_pattern_parent_feedback = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/tp\/feedback\/parents-feedback.*/g;
    if (vipkid_pattern_parent_feedback.exec(window.location)) {
      // We are also in a Classroom. Attach class and buttons
      detected = 'vipkid-parent-feedback';
      $("body").addClass(version);
      attachButtonsForVIPKIDParentFeedback();
    }

    // https://t.vipkid.com.cn/tp/classrooms/international/71981?scheduledDateTime=1542416400000&channel=82&lessonId=597770&studentId=12330378&curriculumVersion=1001&onlineClassId=71981
    var vipkid_pattern_international_classroom = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/tp\/classrooms?\/international\/\d+.*/g;
    if (vipkid_pattern_international_classroom.exec(window.location)) {
      // We are also in a Classroom. Attach class and buttons
      detected = 'vipkid-international';
      $("body").addClass(version);
      attachButtonsForVIPKIDInternational();
    }

    var vipkid_pattern = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/classrooms?\/\d+-\d+-\d+(.shtml)?/g;
    if (vipkid_pattern.exec(window.location)) {
      // We are also in a Classroom. Attach class and buttons
      detected = 'vipkid-flash';
      $("body").addClass(version);
      attachButtonsForVIPKIDFlash();
    }

    var vipkid_warrior_newton_pattern = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/warrior\/.*#\/.*newton.*/g;
    var vipkid_warrior_aristotle_pattern = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/warrior\/.*#\/.*aristotle.*/g;
    var vipkid_warrior_replay_pattern = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/warrior\/.*#\/.*replay.*/g;

    var vipkid_warrior_pattern = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/warrior\/.*#\/(room|replay).*/g;
    if (vipkid_warrior_pattern.exec(window.location)) {

      // Teacher clicked classroom from the class list
      // Wait until we know where we are forwarded

      var warriorCheckInterval = setInterval(()=>{
        if ((window.location.toString().indexOf("room?") == -1)) {

          clearInterval(warriorCheckInterval)

          if (vipkid_warrior_newton_pattern.exec(window.location)) {
            // We are also in a new Classroom. Attach class and buttons
            detected = 'vipkid-warrior-room-newton';
            $("body").addClass(version);
            attachButtonsForVIPKIDWarrior("aristotle");
          }

          if (vipkid_warrior_replay_pattern.exec(window.location)) {
            // We are also in a new Classroom. Attach class and buttons
            detected = 'vipkid-warrior-replay';
            $("body").addClass(version);
            attachButtonsForVIPKIDWarrior("aristotle");
          }

          if (vipkid_warrior_aristotle_pattern.exec(window.location)) {
            // We are also in a new Classroom. Attach class and buttons
            detected = 'vipkid-warrior-room-aristotle';
            $("body").addClass(version);
            attachButtonsForVIPKIDWarrior("aristotle");
          }
        }
      }, 500)
    }

    if (vipkid_warrior_newton_pattern.exec(window.location)) {
      // We are also in a new Classroom. Attach class and buttons
      detected = 'vipkid-warrior-newton';
      $("body").addClass(version);
      attachButtonsForVIPKIDWarrior("aristotle");
    }

    if (vipkid_warrior_aristotle_pattern.exec(window.location)) {
      // We are also in a new Classroom. Attach class and buttons
      detected = 'vipkid-warrior-aristotle';
      $("body").addClass(version);
      attachButtonsForVIPKIDWarrior("aristotle");
    }

    if (vipkid_warrior_replay_pattern.exec(window.location)) {
      // We are also in a new Classroom. Attach class and buttons
      detected = 'vipkid-warrior-replay';
      $("body").addClass(version);
      attachButtonsForVIPKIDWarrior("aristotle");
    }


    var vipkid_classroom_pattern_international = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/tp\/classrooms\/list(\/)?$/g;
    if (vipkid_classroom_pattern_international.exec(window.location)) {
      // We are also in a new Classroom list. Start detection loop. The loop needs to
      // run since pagination is ajax-based

      detected = 'vipkid-classrooms-international'
      $("body").addClass(version);

      if (checkInterval) {
        clearInterval(checkInterval)
      }

      checkInterval = setInterval(()=>{
        if ($(".vip-table")) {
          $(".vip-tab-pane:not([aria-hidden='true']) .vip-table table tbody tr").each((index, i)=>{
            setTimeout(()=>{

              $("button.fbp-attached-button", $(i)).remove()
              attachButtonToElementForVIPKID("classlist-international", i, index,{
                "cursor": "pointer",
                "position": "relative",
                "border-radius": "5px",
                "background-color": "transparent",
                "box-shadow": "none",
                "text-shadow": "none",
                "outline": "none",
                "border": "none",
                "padding": "0 10px",
                "margin": "-20px 0",
                "float": "right"
              },{
                "height": "25px",
                "width": "25px",
                "margin-top": "-5px"
              })
            }, 0)
          })
        } else {
          return
        }
      }, 1000)
    }

    var vipkid_classroom_pattern = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/tc\/(list|missing|all)(\/)?$/g;
    if (vipkid_classroom_pattern.exec(window.location)) {
      // We are also in a new Classroom list. Start detection loop. The loop needs to
      // run since pagination is ajax-based

      detected = 'vipkid-classrooms'
      $("body").addClass(version);

      if (checkInterval) {
        clearInterval(checkInterval)
      }

      checkInterval = setInterval(()=>{
        if ($(".vip-table")) {
          $(".vip-tab-pane:not([aria-hidden='true']) .vip-table table tbody tr").each((index, i)=>{
            setTimeout(()=>{
              $("button.fbp-attached-button", $(i)).remove()
              attachButtonToElementForVIPKID("new-classlist", i, index,{
                "cursor": "pointer",
                "position": "relative",
                "border-radius": "5px",
                "background-color": "transparent",
                "box-shadow": "none",
                "text-shadow": "none",
                "outline": "none",
                "border": "none",
                "padding": "0 10px",
                "margin": "-20px 0",
                "float": "right"
              },{
                "height": "25px",
                "width": "25px",
                "margin-top": "-5px"
              })
            }, 0)
          })

          $(".classroom-list .vip-table table tbody tr").each((index, i)=>{
            setTimeout(()=>{
              $("button.fbp-attached-button", $(i)).remove()
              attachButtonToElementForVIPKID("new-classlist", i, index,{
                "cursor": "pointer",
                "position": "relative",
                "border-radius": "5px",
                "background-color": "transparent",
                "box-shadow": "none",
                "text-shadow": "none",
                "outline": "none",
                "border": "none",
                "padding": "0 10px",
                "margin": "-20px 0",
                "float": "right"
              },{
                "height": "25px",
                "width": "25px",
                "margin-top": "-5px"
              })
            }, 0)
          })

          $(".all-classroom-list .vip-table table tbody tr").each((index, i)=>{
            setTimeout(()=>{
              $("button.fbp-attached-button", $(i)).remove()
              attachButtonToElementForVIPKID("new-classlist", i, index,{
                "cursor": "pointer",
                "position": "relative",
                "border-radius": "5px",
                "background-color": "transparent",
                "box-shadow": "none",
                "text-shadow": "none",
                "outline": "none",
                "border": "none",
                "padding": "0 10px",
                "margin": "-5px 5px 0 0",
                "float": "right"
              },{
                "height": "25px",
                "width": "25px",
                "margin-top": "-5px"
              })
            },0)
          })
        } else {
          return
        }
      }, 1000)
    }

    var vipkid_pattern = /https?:\/\/(www|t|teacher)\.(vipkid\.com|vipkid\.com\.cn|vipkidteachers\.com)\/classrooms?(.shtml)?(\/)?(\?.*)?$/g;
    if (vipkid_pattern.exec(window.location)) {
      // We are also in a Classroom list. Start detection loop. The loop needs to
      // run since pagination is ajax-based

      detected = 'vipkid-classrooms'
      $("body").addClass(version);

      if (checkInterval) {
        clearInterval(checkInterval)
      }

      checkInterval = setInterval(()=>{
        if ($(".classroom-box").length) {
          $(".classroom-box .table-box table tbody tr").each((index, i)=>{
            setTimeout(()=>{

              $("button.fbp-attached-button", $(i)).remove()
              attachButtonToElementForVIPKID("normal", i, {},{
                "cursor": "pointer",
                "position": "relative",
                "border-radius": "5px",
                "background-color": "transparent",
                "box-shadow": "none",
                "text-shadow": "none",
                "outline": "none",
                "border": "none",
                "padding": "0 10px",
                "margin": "-10px 0"
              },{
                "height": "25px",
                "width": "25px",
                "margin-top": "-5px"
              })
            }, 0)
          })
        } else {
          return
        }
      }, 1000)
    }
  }

//
//
// HHHHHHHHH     HHHHHHHHH                   jjjj   iiii
// H:::::::H     H:::::::H                  j::::j i::::i
// H:::::::H     H:::::::H                   jjjj   iiii
// HH::::::H     H::::::HH
//   H:::::H     H:::::H  uuuuuu    uuuuuu jjjjjjjiiiiiii   aaaaaaaaaaaaa  nnnn  nnnnnnnn       ggggggggg   ggggg
//   H:::::H     H:::::H  u::::u    u::::u j:::::ji:::::i   a::::::::::::a n:::nn::::::::nn    g:::::::::ggg::::g
//   H::::::HHHHH::::::H  u::::u    u::::u  j::::j i::::i   aaaaaaaaa:::::an::::::::::::::nn  g:::::::::::::::::g
//   H:::::::::::::::::H  u::::u    u::::u  j::::j i::::i            a::::ann:::::::::::::::ng::::::ggggg::::::gg
//   H:::::::::::::::::H  u::::u    u::::u  j::::j i::::i     aaaaaaa:::::a  n:::::nnnn:::::ng:::::g     g:::::g
//   H::::::HHHHH::::::H  u::::u    u::::u  j::::j i::::i   aa::::::::::::a  n::::n    n::::ng:::::g     g:::::g
//   H:::::H     H:::::H  u::::u    u::::u  j::::j i::::i  a::::aaaa::::::a  n::::n    n::::ng:::::g     g:::::g
//   H:::::H     H:::::H  u:::::uuuu:::::u  j::::j i::::i a::::a    a:::::a  n::::n    n::::ng::::::g    g:::::g
// HH::::::H     H::::::HHu:::::::::::::::uuj::::ji::::::ia::::a    a:::::a  n::::n    n::::ng:::::::ggggg:::::g
// H:::::::H     H:::::::H u:::::::::::::::uj::::ji::::::ia:::::aaaa::::::a  n::::n    n::::n g::::::::::::::::g
// H:::::::H     H:::::::H  uu::::::::uu:::uj::::ji::::::i a::::::::::aa:::a n::::n    n::::n  gg::::::::::::::g
// HHHHHHHHH     HHHHHHHHH    uuuuuuuu  uuuuj::::jiiiiiiii  aaaaaaaaaa  aaaa nnnnnn    nnnnnn    gggggggg::::::g
//                                          j::::j                                                       g:::::g
//                                jjjj      j::::j                                           gggggg      g:::::g
//                               j::::jj   j:::::j                                           g:::::gg   gg:::::g
//                               j::::::jjj::::::j                                            g::::::ggg:::::::g
//                                 jj::::::::::::j                                              gg:::::::::::::g
//                                   jjj::::::jjj                                                 ggg::::::ggg
//                                      jjjjjj                                                       gggggg

  if (hujiang_pattern_main.exec(window.location)) {
    let checkInterval = null
    // We are on hujiang
    detected = 'hujiang';
    $("body").addClass(version);

    if (checkInterval) {
      clearInterval(checkInterval)
    }

    checkInterval = setInterval(()=>{

      // Upcoming Class List
      let upcoming = $(".ms-view .table-responsive table tbody")
      if (upcoming.length) {
        $(".ms-view .table-responsive table button.fbp-attached-button").remove()
        $(".ms-view .table-responsive table tbody tr").each((index, i)=>{
          attachButtonToElementForHujiang("schedule", i, index,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "38px",
            "height": "38px",
            "float": "left",
            "display": "inline",
            "margin-top": "-7px",
            "right": "0",
            "bottom": "0px"
          },{
            "height": "25px",
            "width": "25px",
            "left": "0"
          })
        })
      }

      // Class History List
      let history = $("#comment")
      if (history.length) {
        $(".button.fbp-attached-button").remove()
          attachButtonToElementForHujiang("feedback", "body", null,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "50px",
            "height": "50px",
            "position": "fixed",
            "bottom": "25px",
            "right": "25px",
            "z-index": "1000",
            "text-align": "left",
            display: "inline-block"
          },{
            "height": "50px",
            "width": "50px",
            "left": "0",
          })
      }
    }, 1000)
  }


  // Start DaDaABC detection
  /*

DDDDDDDDDDDDD                         DDDDDDDDDDDDD                                        AAA               BBBBBBBBBBBBBBBBB           CCCCCCCCCCCCC
D::::::::::::DDD                      D::::::::::::DDD                                    A:::A              B::::::::::::::::B       CCC::::::::::::C
D:::::::::::::::DD                    D:::::::::::::::DD                                 A:::::A             B::::::BBBBBB:::::B    CC:::::::::::::::C
DDD:::::DDDDD:::::D                   DDD:::::DDDDD:::::D                               A:::::::A            BB:::::B     B:::::B  C:::::CCCCCCCC::::C
D:::::D    D:::::D  aaaaaaaaaaaaa     D:::::D    D:::::D  aaaaaaaaaaaaa              A:::::::::A             B::::B     B:::::B C:::::C       CCCCCC
D:::::D     D:::::D a::::::::::::a    D:::::D     D:::::D a::::::::::::a            A:::::A:::::A            B::::B     B:::::BC:::::C
D:::::D     D:::::D aaaaaaaaa:::::a   D:::::D     D:::::D aaaaaaaaa:::::a          A:::::A A:::::A           B::::BBBBBB:::::B C:::::C
D:::::D     D:::::D          a::::a   D:::::D     D:::::D          a::::a         A:::::A   A:::::A          B:::::::::::::BB  C:::::C
D:::::D     D:::::D   aaaaaaa:::::a   D:::::D     D:::::D   aaaaaaa:::::a        A:::::A     A:::::A         B::::BBBBBB:::::B C:::::C
D:::::D     D:::::D aa::::::::::::a   D:::::D     D:::::D aa::::::::::::a       A:::::AAAAAAAAA:::::A        B::::B     B:::::BC:::::C
D:::::D     D:::::Da::::aaaa::::::a   D:::::D     D:::::Da::::aaaa::::::a      A:::::::::::::::::::::A       B::::B     B:::::BC:::::C
D:::::D    D:::::Da::::a    a:::::a   D:::::D    D:::::Da::::a    a:::::a     A:::::AAAAAAAAAAAAA:::::A      B::::B     B:::::B C:::::C       CCCCCC
DDD:::::DDDDD:::::D a::::a    a:::::a DDD:::::DDDDD:::::D a::::a    a:::::a    A:::::A             A:::::A   BB:::::BBBBBB::::::B  C:::::CCCCCCCC::::C
D:::::::::::::::DD  a:::::aaaa::::::a D:::::::::::::::DD  a:::::aaaa::::::a   A:::::A               A:::::A  B:::::::::::::::::B    CC:::::::::::::::C
D::::::::::::DDD     a::::::::::aa:::aD::::::::::::DDD     a::::::::::aa:::a A:::::A                 A:::::A B::::::::::::::::B       CCC::::::::::::C
DDDDDDDDDDDDD         aaaaaaaaaa  aaaaDDDDDDDDDDDDD         aaaaaaaaaa  aaaaAAAAAAA                   AAAAAAABBBBBBBBBBBBBBBBB           CCCCCCCCCCCCC
   */
  if (dadaabc_pattern_main.exec(window.location)) {
    let checkInterval = null
    // We are on gogokid
    detected = 'dadaabc';
    $("body").addClass(version);

    if (checkInterval) {
      clearInterval(checkInterval)
    }

    checkInterval = setInterval(()=>{

      // Check if there is a table.class-list
      if ($("table.class-list").length > 0) {
        let classList = $("table.class-list")
        let rows = $("tr", classList)
        $("button.fbp-attached-button", classList).remove()
        rows.each((index, row)=>{
          attachButtonToElementForDaDaABC("classList", row, index,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "38px",
            "height": "38px",
            "margin-left": "10px",
            "position": "absolute",
            "right": "0",
            "bottom": "0px"
          },{
            "height": "25px",
            "width": "25px",
            "left": "0"
          })
        })
      } else {}
    }, 1000)
  }



  // Start gogokid detection
  /*


      GGGGGGGGGGGGG     OOOOOOOOO             GGGGGGGGGGGGG     OOOOOOOOO     KKKKKKKKK    KKKKKKKIIIIIIIIIIDDDDDDDDDDDDD
    GGG::::::::::::G   OO:::::::::OO        GGG::::::::::::G   OO:::::::::OO   K:::::::K    K:::::KI::::::::ID::::::::::::DDD
  GG:::::::::::::::G OO:::::::::::::OO    GG:::::::::::::::G OO:::::::::::::OO K:::::::K    K:::::KI::::::::ID:::::::::::::::DD
G:::::GGGGGGGG::::GO:::::::OOO:::::::O  G:::::GGGGGGGG::::GO:::::::OOO:::::::OK:::::::K   K::::::KII::::::IIDDD:::::DDDDD:::::D
G:::::G       GGGGGGO::::::O   O::::::O G:::::G       GGGGGGO::::::O   O::::::OKK::::::K  K:::::KKK  I::::I    D:::::D    D:::::D
G:::::G              O:::::O     O:::::OG:::::G              O:::::O     O:::::O  K:::::K K:::::K     I::::I    D:::::D     D:::::D
G:::::G              O:::::O     O:::::OG:::::G              O:::::O     O:::::O  K::::::K:::::K      I::::I    D:::::D     D:::::D
G:::::G    GGGGGGGGGGO:::::O     O:::::OG:::::G    GGGGGGGGGGO:::::O     O:::::O  K:::::::::::K       I::::I    D:::::D     D:::::D
G:::::G    G::::::::GO:::::O     O:::::OG:::::G    G::::::::GO:::::O     O:::::O  K:::::::::::K       I::::I    D:::::D     D:::::D
G:::::G    GGGGG::::GO:::::O     O:::::OG:::::G    GGGGG::::GO:::::O     O:::::O  K::::::K:::::K      I::::I    D:::::D     D:::::D
G:::::G        G::::GO:::::O     O:::::OG:::::G        G::::GO:::::O     O:::::O  K:::::K K:::::K     I::::I    D:::::D     D:::::D
G:::::G       G::::GO::::::O   O::::::O G:::::G       G::::GO::::::O   O::::::OKK::::::K  K:::::KKK  I::::I    D:::::D    D:::::D
G:::::GGGGGGGG::::GO:::::::OOO:::::::O  G:::::GGGGGGGG::::GO:::::::OOO:::::::OK:::::::K   K::::::KII::::::IIDDD:::::DDDDD:::::D
  GG:::::::::::::::G OO:::::::::::::OO    GG:::::::::::::::G OO:::::::::::::OO K:::::::K    K:::::KI::::::::ID:::::::::::::::DD
    GGG::::::GGG:::G   OO:::::::::OO        GGG::::::GGG:::G   OO:::::::::OO   K:::::::K    K:::::KI::::::::ID::::::::::::DDD
      GGGGGG   GGGG     OOOOOOOOO             GGGGGG   GGGG     OOOOOOOOO     KKKKKKKKK    KKKKKKKIIIIIIIIIIDDDDDDDDDDDDD

     */
  if (gogokid_pattern_main.exec(window.location)) {
    let checkInterval = null
    // We are on gogokid
    detected = 'gogokid';
    $("body").addClass(version);

    if (checkInterval) {
      clearInterval(checkInterval)
    }

    checkInterval = setInterval(()=>{

      let buttonInserted = false;

      // Parent Evaluation

      var gogokid_pattern_parent_evaluations = /https:\/\/teacher\.gogokid\.com\/feedbacks.*/g
      if (gogokid_pattern_parent_evaluations.exec(window.location)) {
        // We are also in a Classroom. Attach class and buttons
        detected = 'gogokid-parent-evaluation';
        $("body").addClass(version);
        attachButtonsForGogoKidParentEvaluation();
        buttonInserted = true;
      }

      // Gogokid 2.0 portal evaluation screen
      let wrapper = $(".student-evaluation")
      if (wrapper.length) {
        $(".student-evaluation button.fbp-attached-button").remove()
        attachButtonToElementForGogokid("student-evaluation", wrapper, {}, {
          "cursor": "pointer",
          "position": "relative",
          "border-radius": "5px",
          "background-color": "transparent",
          "box-shadow": "none",
          "text-shadow": "none",
          "outline": "none",
          "border": "none",
          "width": "38px",
          "height": "38px",
          "margin-left": "10px",
          "position": "relative",
          "right": "20px",
          "float": "right",
          "top": "20px"
        },{
          "height": "25px",
          "width": "25px",
          "left": "0"
        })
        buttonInserted = true;
      }

      // Portal 2.0 Upcoming Class List
      let upcoming = $(".upcoming-classes-wrapper .classes-box .class-class")
      if (upcoming.length) {
        $(".upcoming-classes-wrapper .classes-box .class-class button.fbp-attached-button").remove()
        $(".upcoming-classes-wrapper .classes-box .class-class .classes-base-card").each((index, i)=>{
          attachButtonToElementForGogokid("upcoming", i, index,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "38px",
            "height": "38px",
            "margin-left": "10px",
            "position": "relative",
            "right": "0",
            "bottom": "0px"
          },{
            "height": "25px",
            "width": "25px",
            "left": "0"
          })
          buttonInserted = true;
        })
      }


      // Portal 2.0 Home Screen Upcoming Class List
      let home_upcoming = $(".home-wrapper .upcoming-wrap .classes-base-card")
      if (home_upcoming.length) {
        $(".home-wrapper .upcoming-wrap .classes-base-card button.fbp-attached-button").remove()
        $(".home-wrapper .upcoming-wrap .classes-base-card").each((index, i)=>{
          attachButtonToElementForGogokid("home-upcoming", i, index,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "38px",
            "height": "38px",
            "margin-left": "10px",
            "position": "relative",
            "right": "0",
            "bottom": "0px"
          },{
            "height": "25px",
            "width": "25px",
            "left": "0"
          })
          buttonInserted = true;
        })
      }

      // Portal 2.0 Home Screen Evaluation Class List
      let home_evaluation = $(".home-wrapper .evaluation-wrap .classes-base-card")
      if (home_evaluation.length) {
        $(".home-wrapper .evaluation-wrap .classes-base-card button.fbp-attached-button").remove()
        $(".home-wrapper .evaluation-wrap .classes-base-card").each((index, i)=>{
          attachButtonToElementForGogokid("home-evaluation", i, index,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "38px",
            "height": "38px",
            "margin-left": "10px",
            "position": "relative",
            "right": "0",
            "bottom": "0px"
          },{
            "height": "25px",
            "width": "25px",
            "left": "0"
          })
          buttonInserted = true;
        })
      }

      // Portal 2.0 Evaluation List
      let evaluation = $(".evaluation-list-wrapper .classes-box .class-class")
      if (evaluation.length) {
        $(".evaluation-list-wrapper .classes-box .class-class button.fbp-attached-button").remove()
        $(".evaluation-list-wrapper .classes-box .class-class .classes-base-card").each((index, i)=>{
          attachButtonToElementForGogokid("evaluation", i, index,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "38px",
            "height": "38px",
            "margin-left": "10px",
            "position": "relative",
            "right": "0",
            "bottom": "0px"
          },{
            "height": "25px",
            "width": "25px",
            "left": "0"
          })
          buttonInserted = true;
        })
      }

      // Portal 2.0 Class History List
      let history = $(".my-history-table table")
      if (history.length) {
        $(".my-history-table button.fbp-attached-button").remove()
        $(".my-history-table table tbody tr").each((index, i)=>{
          attachButtonToElementForGogokid("list", i, index,{
            "cursor": "pointer",
            "position": "relative",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "width": "25px",
            "height": "25px",
            "text-align": "left",
            display: "inline-block"
          },{
            "height": "25px",
            "width": "25px",
            "left": "0",
          })
          buttonInserted = true;
        })
      }

      // Popups (deprecated)
      let exPopupCheck = $(".ex-dialog-title:contains('Student Evaluation')")
      let exPopup = $(".evaluation-dialog")
      if (exPopup.length) {
          $(".evaluation-dialog button.fbp-attached-button").remove()
          attachButtonToElementForGogokid("ex", exPopup, {},{
            "cursor": "pointer",
            "position": "absolute",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "left": "6px",
            "top": "17px"
          },{
            "height": "25px",
            "width": "25px",
            "margin-top": "-5px"
          })
          buttonInserted = true;
      }

      let popup = $(".evaluation-normal-pop")
      if (popup.length) {
          $(".evaluation-normal-pop button.fbp-attached-button").remove()
          attachButtonToElementForGogokid("normal", popup, {},{
            "cursor": "pointer",
            "position": "absolute",
            "border-radius": "5px",
            "background-color": "transparent",
            "box-shadow": "none",
            "text-shadow": "none",
            "outline": "none",
            "border": "none",
            "left": "6px",
            "top": "17px"
          },{
            "height": "25px",
            "width": "25px",
            "margin-top": "-5px"
          })
          buttonInserted = true;

      } else {
        if (!buttonInserted) {
          var prevButton = $(".fbp-attached-button")
          prevButton.remove()
        }
        return
      }
    }, 1000)

  }


/*
IIIIIIIIIITTTTTTTTTTTTTTTTTTTTTTTUUUUUUUU     UUUUUUUUTTTTTTTTTTTTTTTTTTTTTTT     OOOOOOOOO     RRRRRRRRRRRRRRRRR
I::::::::IT:::::::::::::::::::::TU::::::U     U::::::UT:::::::::::::::::::::T   OO:::::::::OO   R::::::::::::::::R
I::::::::IT:::::::::::::::::::::TU::::::U     U::::::UT:::::::::::::::::::::T OO:::::::::::::OO R::::::RRRRRR:::::R
 II::::::IIT:::::TT:::::::TT:::::TUU:::::U     U:::::UUT:::::TT:::::::TT:::::TO:::::::OOO:::::::ORR:::::R     R:::::R
  I::::I  TTTTTT  T:::::T  TTTTTT U:::::U     U:::::U TTTTTT  T:::::T  TTTTTTO::::::O   O::::::O  R::::R     R:::::R
  I::::I          T:::::T         U:::::D     D:::::U         T:::::T        O:::::O     O:::::O  R::::R     R:::::R
  I::::I          T:::::T         U:::::D     D:::::U         T:::::T        O:::::O     O:::::O  R::::RRRRRR:::::R
  I::::I          T:::::T         U:::::D     D:::::U         T:::::T        O:::::O     O:::::O  R:::::::::::::RR
  I::::I          T:::::T         U:::::D     D:::::U         T:::::T        O:::::O     O:::::O  R::::RRRRRR:::::R
  I::::I          T:::::T         U:::::D     D:::::U         T:::::T        O:::::O     O:::::O  R::::R     R:::::R
  I::::I          T:::::T         U:::::D     D:::::U         T:::::T        O:::::O     O:::::O  R::::R     R:::::R
  I::::I          T:::::T         U::::::U   U::::::U         T:::::T        O::::::O   O::::::O  R::::R     R:::::R
II::::::II      TT:::::::TT       U:::::::UUU:::::::U       TT:::::::TT      O:::::::OOO:::::::ORR:::::R     R:::::R
I::::::::I      T:::::::::T        UU:::::::::::::UU        T:::::::::T       OO:::::::::::::OO R::::::R     R:::::R
I::::::::I      T:::::::::T          UU:::::::::UU          T:::::::::T         OO:::::::::OO   R::::::R     R:::::R
IIIIIIIIII      TTTTTTTTTTT            UUUUUUUUU            TTTTTTTTTTT           OOOOOOOOO     RRRRRRRR     RRRRRRR
  */

  if (itutorgroup_pattern_main.exec(window.location) || itutorgroup_pattern_main_1.exec(window.location)) {
    detected = 'tutorabc'

    $("body").addClass(version);

    // Create the FeedbackPanda button
    let fbpBtn = document.createElement("button")
    let fbpImg = document.createElement("img")

    fbpBtn.type = "button"
    fbpBtn.classList.add("fbp-attached-button")
    fbpBtn.title = "Open with FeedbackPanda"
    fbpImg.src = pandaImage
    fbpBtn.appendChild(fbpImg)

    // Inject CSS for styling the FeedbackPanda buttons
    var css = `
      /* Used in aligning the panda button in iTutor for adults */
      .infotitle:first-of-type {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
            -ms-flex-pack: justify;
                justify-content: space-between;
      }
      .fbp-attached-button {
        background-color: transparent;
        border: none;
        border-radius: 5px;
        box-shadow: none;
        color: #fff;
        font-family: "sans-serif";
        text-shadow: none;
        outline: none;
        width: 30px;
        height: 30px;
        margin: 0 0 0 10px;
        padding: 0;
        position: relative;
        z-index: 10000;
        vertical-align: top;
        cursor: pointer;
      }
      .fbp-attached-button img {
        max-width: 100%;
        height: auto;
        pointer-events: none;
      }`
    var head = document.head || document.getElementsByTagName('head')[0]
    var style = document.createElement('style')

    head.appendChild(style);
    style.type = 'text/css';

    if (style.styleSheet) {
      // This is required for IE8 and below.
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    if (document.querySelector('form[action*="ConsultantSystem/Report/JrDemoReport"]')) {
      // iTutor Demo Report
      var msg = {}

      // Get the container where the button will be inserted
      let targetElement = document.querySelector("div.infotitle:first-of-type");

      targetElement.appendChild(fbpBtn)

      let student_id = document.querySelector("input[name='ClientSn']").value;
      let course_id = document.querySelector("input[name='DemoDetailSn']").value;
      let teacher_id = document.querySelector("input[name='ConSn']").value;

      try {
        msg = {
          school: detected,
          student_id: student_id,
          course_id: course_id,
          teacher_id: teacher_id
        }
      } catch (e) {
        console.log("FeedbackPanda ran into an error extracting data", e)
      }

      fbpBtn.addEventListener("click", (e) => {
        goToFeedbackPanda(e, msg);
      })
    } else if (document.querySelector('form[action*="/ConsultantSystem/Report/ProgressReport"]')) {
      // Get the general data
      let teacher_id = document.getElementById('ConsultantSn').value
      let course_id = document.getElementById('Room').value
      let classroom_id = document.getElementById('MaterialCourse').value

      var allowPaste = function(e){
		  e.stopImmediatePropagation();
		  return true;
		};
		document.addEventListener('paste', allowPaste, true);
		
      // Get all customers
      let customers = document.querySelectorAll('label[for*="ProgressReportClientInfoList"][for$="ClientName"]')

      if (customers) {
        // Loop over each student
        customers.forEach((el, i) => {
          var msg = {}

          // Make a copy of the original panda button before appending it
          let btn = fbpBtn.cloneNode(true)
          el.appendChild(btn)

          // Get report data
          let student_id = document.getElementById('ProgressReportClientInfoList_'+ i +'__ClientSn').value
          let student_suggested_name = el.innerText

          try {
            msg = {
              classroom_id: classroom_id,
              course_id: course_id,
              school: detected,
              student_id: student_id,
              student_suggested_name: student_suggested_name,
              teacher_id: teacher_id
            }
          } catch (e) {
            console.log("FeedbackPanda ran into an error extracting data", e)
          }

          // Add click event to the panda button
          btn.addEventListener("click", (e) => {
            goToFeedbackPanda(e, msg);
          })
        });
      }
    } else {
      // iTutor Junior
      setTimeout(function() {
        let injectionCode = `
          try {
            let app = document.querySelector(".pr-container")
            let vue = app.__vue__

            app.dataset.payload = btoa(unescape(encodeURIComponent(JSON.stringify(vue.baseData))))
          } catch (e) {
            console.log('FeedbackPanda ran into an error finding important data', e)
          }`;

        var script = document.createElement('script');
        var code = document.createTextNode('(function() {' + injectionCode + '})();');
        script.appendChild(code);
        (document.body || document.head).appendChild(script);

        let app = document.querySelector(".pr-container")

        try {
          let payload = JSON.parse(decodeURIComponent(escape(atob(app.dataset.payload))))
          let students = payload.clientInfos

          if (students.length > 0) {
            // Get the elements where the pands will be inserted
            let targets = document.querySelectorAll('.report.comment-box .collapse-box ul li')

            students.forEach((student, i) => {
              let msg = {
                school: detected,
                student_id: student.clientSn,
                student_suggested_name: student.clientName,
                classroom_id: payload.sessionSn + "_" + student.clientSn,
                course_id: payload.sessionKind,
                course_suggested_name: payload.lessonTitle,
                school: detected,
                student_id: student.clientSn,
                student_suggested_name: student.clientName,
                teacher_id: payload.conSn
              }

              // Make a copy of the original panda button before appending it
              let btn = fbpBtn.cloneNode(true)
              targets[i].querySelector('.item-box').appendChild(btn)

              // Insert the student data into the panda
              btn.dataset.payload = btoa(unescape(encodeURIComponent(JSON.stringify(msg))))

              // Add click event to the panda button
              btn.addEventListener("click", (e) => {
                let msg = JSON.parse(decodeURIComponent(escape(atob(e.target.dataset.payload))))
                goToFeedbackPanda(e, msg);
              })
            });
          }
        } catch(e) {
          console.log(e)
        }
      }, 4000);
    }

    // Open the FeedbackPanda app
    function goToFeedbackPanda(e, msg) {
      if (msg) {
        chrome.runtime.sendMessage({
          "message": "transmit_external_data",
          "url": window.location.href,
          "data": msg
        });
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }

/*
MMMMMMMM               MMMMMMMMMMMMMMMM               MMMMMMMMEEEEEEEEEEEEEEEEEEEEEE               AAA               RRRRRRRRRRRRRRRRR      SSSSSSSSSSSSSSS
M:::::::M             M:::::::MM:::::::M             M:::::::ME::::::::::::::::::::E              A:::A              R::::::::::::::::R   SS:::::::::::::::S
M::::::::M           M::::::::MM::::::::M           M::::::::ME::::::::::::::::::::E             A:::::A             R::::::RRRRRR:::::R S:::::SSSSSS::::::S
M:::::::::M         M:::::::::MM:::::::::M         M:::::::::MEE::::::EEEEEEEEE::::E            A:::::::A            RR:::::R     R:::::RS:::::S     SSSSSSS
M::::::::::M       M::::::::::MM::::::::::M       M::::::::::M  E:::::E       EEEEEE           A:::::::::A             R::::R     R:::::RS:::::S
M:::::::::::M     M:::::::::::MM:::::::::::M     M:::::::::::M  E:::::E                       A:::::A:::::A            R::::R     R:::::RS:::::S
M:::::::M::::M   M::::M:::::::MM:::::::M::::M   M::::M:::::::M  E::::::EEEEEEEEEE            A:::::A A:::::A           R::::RRRRRR:::::R  S::::SSSS
M::::::M M::::M M::::M M::::::MM::::::M M::::M M::::M M::::::M  E:::::::::::::::E           A:::::A   A:::::A          R:::::::::::::RR    SS::::::SSSSS
M::::::M  M::::M::::M  M::::::MM::::::M  M::::M::::M  M::::::M  E:::::::::::::::E          A:::::A     A:::::A         R::::RRRRRR:::::R     SSS::::::::SS
M::::::M   M:::::::M   M::::::MM::::::M   M:::::::M   M::::::M  E::::::EEEEEEEEEE         A:::::AAAAAAAAA:::::A        R::::R     R:::::R       SSSSSS::::S
M::::::M    M:::::M    M::::::MM::::::M    M:::::M    M::::::M  E:::::E                  A:::::::::::::::::::::A       R::::R     R:::::R            S:::::S
M::::::M     MMMMM     M::::::MM::::::M     MMMMM     M::::::M  E:::::E       EEEEEE    A:::::AAAAAAAAAAAAA:::::A      R::::R     R:::::R            S:::::S
M::::::M               M::::::MM::::::M               M::::::MEE::::::EEEEEEEE:::::E   A:::::A             A:::::A   RR:::::R     R:::::RSSSSSSS     S:::::S
M::::::M               M::::::MM::::::M               M::::::ME::::::::::::::::::::E  A:::::A               A:::::A  R::::::R     R:::::RS::::::SSSSSS:::::S
M::::::M               M::::::MM::::::M               M::::::ME::::::::::::::::::::E A:::::A                 A:::::A R::::::R     R:::::RS:::::::::::::::SS
MMMMMMMM               MMMMMMMMMMMMMMMM               MMMMMMMMEEEEEEEEEEEEEEEEEEEEEEAAAAAAA                   AAAAAAARRRRRRRR     RRRRRRR SSSSSSSSSSSSSSS
 */
  if (magicears_pattern_main.exec(window.location)) {
    // We are on MagicEars

    var magicears_pattern = /https?:\/\/t\.mmears\.com\/v2\/evaluate\?studentId=.*/g;
    if (magicears_pattern.exec(window.location)) {
      // We are also on an Eval Page. Attach class and buttons
      detected = 'magicears';
      $("body").addClass(version);
      attachButtonsForMmearsEval();
    }

    // https://t.mmears.com/course/list
    var magicears_pattern_course_list = /https?:\/\/t\.mmears\.com\/course\/list.*/g;
    if (magicears_pattern_course_list.exec(window.location)) {
      // We are also on an Eval Page. Attach class and buttons
      detected = 'magicears-courselist';
      $("body").addClass(version);

      if (checkInterval) {
        clearInterval(checkInterval)
      }

      checkInterval = setInterval(()=>{
        if ($(".course_container_list")) {
          $(".course_container_list .course_detail table tbody tr:not(.table_title)").each((index, i)=>{
            $("button.fbp-attached-button", $(i)).remove()
            attachButtonToElementForMmearsClasslist("classlist", i, index,{
              "cursor": "pointer",
              "background-color": "transparent",
              "box-shadow": "none",
              "text-shadow": "none",
              "outline": "none",
              "border": "none",
              "padding": "0 2px 0 0",
              "margin": "1px 0px 0px 0px",
              "display": "inline",
              "vertical-align": "top"
            },{
              "height": "15px",
              "width": "15px",
            })
          })
        } else {
          return
        }
      }, 1000)
    }
  }





  // VVVVVVVV           VVVVVVVVIIIIIIIIIIPPPPPPPPPPPPPPPPP   XXXXXXX       XXXXXXX
  // V::::::V           V::::::VI::::::::IP::::::::::::::::P  X:::::X       X:::::X
  // V::::::V           V::::::VI::::::::IP::::::PPPPPP:::::P X:::::X       X:::::X
  // V::::::V           V::::::VII::::::IIPP:::::P     P:::::PX::::::X     X::::::X
  //  V:::::V           V:::::V   I::::I    P::::P     P:::::PXXX:::::X   X:::::XXX
  //  V:::::V         V:::::V    I::::I    P::::P     P:::::P   X:::::X X:::::X
  //  V:::::V       V:::::V     I::::I    P::::PPPPPP:::::P     X:::::X:::::X
  //  V:::::V     V:::::V      I::::I    P:::::::::::::PP       X:::::::::X
  //  V:::::V   V:::::V       I::::I    P::::PPPPPPPPP         X:::::::::X
  //  V:::::V V:::::V        I::::I    P::::P                X:::::X:::::X
  //  V:::::V:::::V         I::::I    P::::P               X:::::X X:::::X
  //  V:::::::::V          I::::I    P::::P            XXX:::::X   X:::::XXX
  //  V:::::::V         II::::::IIPP::::::PP          X::::::X     X::::::X
  //  V:::::V          I::::::::IP::::::::P          X:::::X       X:::::X
  //  V:::V           I::::::::IP::::::::P          X:::::X       X:::::X
  //  VVV            IIIIIIIIIIPPPPPPPPPP          XXXXXXX       XXXXXXX






    if (vipx_pattern_main.exec(window.location)) {
      let checkInterval = null
      // We are on gogokid
      detected = 'vipx';
      $("body").addClass(version);

      if (checkInterval) {
        clearInterval(checkInterval)
      }

      checkInterval = setInterval(()=>{

        let buttonInserted = false;

        var vipx_class_list = /https:\/\/.*\.vipx\.com\/myClasses.*/g
        if (vipx_class_list.exec(window.location)) {
          detected = 'vipx-class-list';
          $("body").addClass(version);

          let vipx_popup = $(".newFeedbackBox")
          if (vipx_popup.length) {
            $(".newFeedbackBox button.fbp-attached-button").remove()

            attachButtonsForVIPXPopup(vipx_popup, {
              "cursor": "pointer",
              "position": "absolute",
              "border-radius": "5px",
              "background-color": "transparent",
              "box-shadow": "none",
              "text-shadow": "none",
              "outline": "none",
              "border": "none",
              "width": "38px",
              "height": "38px",
              "margin-left": "10px",
              "left": "10px",
              "top": "10px",
              "z-index": 99999
            },{
              "height": "25px",
              "width": "25px",
              "left": "0"
            })
            buttonInserted = true;
          }

          let vipx_class_wrapper = $(".my-class")
          if (vipx_class_wrapper.length) {
            $(".my-class button.fbp-attached-button").remove()

            $(".my-class .schedule-box table tr").each((index, i)=>{
              attachButtonsForVIPXClassList("class-list", i, index-1,{
                "cursor": "pointer",
                "position": "relative",
                "border-radius": "5px",
                "background-color": "transparent",
                "box-shadow": "none",
                "text-shadow": "none",
                "outline": "none",
                "border": "none",
                "width": "38px",
                "height": "38px",
                "margin-left": "10px",
                "position": "relative",
                "right": "0",
                "bottom": "0px"
              },{
                "height": "25px",
                "width": "25px",
                "left": "0"
              })
              buttonInserted = true;
            })
          }


          // attachButtonsForVIPXClassList("");
          // buttonInserted = true;
        } else {
          if (!buttonInserted) {
            var prevButton = $(".fbp-attached-button")
            prevButton.remove()
          }
          return
        }
      }, 1000)

    }



















  // OLD INTEGRATION


  if (alo7_pattern_main.exec(window.location)) {
    // We are on MagicEars
    var alo7_pattern = /https:\/\/www\.aizhuanjiao\.com\/t\/reports\?awjcls_lesson_id=(\d+).*/g;
    if (alo7_pattern.exec(window.location)) {
      // We are also on an Eval Page. Attach class and buttons
      detected = 'alo7';
      $("body").addClass(version);
      attachButtons("left");
    }
  }


  if (landi_english_pattern_main.exec(window.location)) {
    // We are on Landi
    detected = 'landi_english';
    $("body").addClass(version);

    // Start detection loop
    var checkInterval = setInterval(()=>{

      // We are looking for a div that indicates a memo there
      // which may be different depending on the page type (that can
      // be inferred from the site structure)
      let memo_containers = $(".memo-div")
      let month_memo_containers = $(".month-memo")

      // These types exist:
      // 'normal' - Any regular class
      // 'monthly' - the monthly quiz
      let type = 'normal';
      if (month_memo_containers.length > 0) {
        type = 'monthly'
      }

      // Stop checking if the memo container is missing
      if ((memo_containers.length == 0) && (month_memo_containers.length == 0)) {
        return
      }

      // If some are found, we check that they're actually input fields for
      //  student memos
      let memo_texts = ''
      let memo_inputs = ''

      if (type == 'normal') {
        memo_texts = $(".memo-div .memo-header");
        memo_inputs = $(".memo-div .same.areas textarea")
      }

      if (type == 'monthly') {
        memo_texts = $(".month-memo .memo-head")
        memo_inputs = $(".month-memo .option-overall textarea")
      }

      let contains_student_memo_text = function (text) {
        return (text.indexOf('Memo For student:') > -1) || (text.indexOf('Monthly Quiz For student:') > -1)
      }

      // If we can't find input fields or the phrase 'Memo for student', abort
      if(memo_texts.length == 0 || memo_inputs.length == 0 || !contains_student_memo_text($(memo_texts).text())) {
        return
      }

      // Buttons already there, nothing to do
      if ($(".fbp-attached-button").length > 0) {
        return
      }

      // Else we attach two buttons
      $(memo_texts).each((index, i)=>{

        // We can retrieve the student name and id right from the page.
        let student_text = $(i).text().replace('Memo For student:', '').replace('Monthly Quiz For student:', '').trim()

        // the class ID is right there as well
        // Deprecated/Doesn't work anymore: let class_id = $(".class-id").text()
        let class_id = document.querySelector(".class-header .ivu-row div:first-child").childNodes[0].nodeValue.replace('Class ID:', '').trim()

        // Course ID and Course name will be attached on button click later
        attachButtonToElementForLandi(type,
          i,
          {
            student_id: student_text.replace(/^.*@/g, '').replace(/[^0-9]*/g,''),
            student_name: student_text.replace(/@.*$/, ''),
            class_id
          }, {
          "cursor": "pointer",
          "z-index": 10000,
          "position": "relative",
          "border-radius": "5px",
          "font-family": "sans-serif",
          "color": "white",
          "background-color": "transparent",
          "box-shadow": "none",
          "text-shadow": "none",
          "outline": "none",
          "border": "none",
          "padding": "0 10px"
        },{
          "height": "30px",
          "width": "30px"
        }
      )
      })
    }, 1000)
  }



} catch (exception) {
  console.log("FeedbackPanda Extension ran into an Error. Please tell us about it at bugs@feedbackpanda.com. The Error was:", exception )
}
