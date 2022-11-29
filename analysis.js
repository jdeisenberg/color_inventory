/* utility function that converts a series of color bytes
 * to an integer for comparison purposes
 */
let rgbToHsv = (colorBytes) => {
  let r = colorBytes[0] / 255;
  let g = colorBytes[1] / 255;
  let b = colorBytes[2] / 255;
  let cMax = Math.max(r, Math.max(g, b));
  let cMin = Math.min(r, Math.min(g, b));
  let delta = cMax - cMin;
  
  let hue;
  if (delta == 0) {
    hue = 0;
  } else if (cMax == r) {
    hue = 60.0 * (((g - b) / delta) % 6);
  } else if (cMax == g) {
    hue = 60.0 * (((b - r) / delta) + 2);
  } else {
    hue = 60.0 * (((r - g) / delta) + 4);
  }
  
  let saturation = (cMax == 0) ? 0 : (delta / cMax);
  let value = cMax;
  
  return [hue, saturation, value];
}

let compareColors = (color1, color2) => {
  let [hue1, sat1, val1] = rgbToHsv(color1);
  let [hue2, sat2, val2] = rgbToHsv(color2);

  /* compare by hues first */
  if (hue1 > hue2) {
    result = 1;
  } else if (hue1 < hue2) {
    result = -1;
  } else { // sort descending by saturation
    result = sat2-sat1;
  }

  return result;
}
    
let updateAnalysis = () => {
  
  /*
   * Go through entire image and find “matching” colors
   */
  let removeChosen = document.getElementById("removeChosen").checked;
  let colorDistance = parseInt(document.getElementById("colorDistance").value);
  let ctx = previewSaveCanvas.getContext('2d');
  let imageData = ctx.getImageData(0, 0, previewSaveCanvas.width, previewSaveCanvas.height);
  let dataBytes = imageData.data;
  let unsortedColors = [];
  let sortedColors = [];
  let totalChosenPixels = 0;
  let textArea = document.getElementById('textArea');
  
  clearSVG();
  document.getElementById("textArea").value = '';
  
  chosenColors.forEach((item) => {
    count = 0;
    for (let i = 0; i < dataBytes.length; i += 4) {
      color = dataBytes.slice(i, i + 4);
      if (color[3] !== 0) {
        let total = 0;
        /*
         * Simple metric for distance between colors:
         * total of absolute differences in red, green, and blue
         */
        for (let j = 0; j < 3; j++) {
          total += Math.abs(color[j] - item[j]);
        }
        
        /* If color difference is less than the desired distance,
         * it’s the “same color.”
         */
        if (total <= colorDistance) {
          count++;
          totalChosenPixels++;
          if (removeChosen) { // make chosen pixels transparent
            dataBytes[i + 3] = 0;
          }
        }
      }
    }
    unsortedColors.push([item, count]);
    sortedColors.push([item, count]);
  });
  
  /* Create an imageData object from the byte array, and display it */
  imageData.data.set(new Uint8ClampedArray(dataBytes));
  previewContext.putImageData(imageData, 0, 0);
  
  /* now sort the results array by descending count */
  let proportionSetting = document.getElementById("proportion").value;
  
  if (document.getElementById("sortByColor").checked) {
    sortedColors.sort(([color1, count1], [color2, count2]) => {
      compareColors(color1, color2);
    });
  }
  else
  {
    if (proportionSetting !== "nonprop") {
      sortedColors.sort(([color1, count1], [color2, count2]) => {
        return count2 - count1
      });
    }
    else {
      for (let i = 0; i < chosenColors.length; i++) {
        sortedColors[i] = [unsortedColors[i][0], unsortedColors[i][1]];
      }
    }
  }
  
  if (proportionSetting !== "nonprop") {
    let total = (proportionSetting === "all") ?
      preview.width * preview.height : totalChosenPixels;
    let xPos = 10;
    sortedColors.forEach( ([color, count]) => {
      let group = document.createElementNS(svgNS, "g");
      let title = document.createElementNS(svgNS, "title");
      let percent = count / total;
      let percentString = (percent * 100.0).toFixed(0) + "%";
      let rgb = "rgb(" + color[0] + ", " + color[1] +
        ", " + color[2] + ")"
      title.appendChild(document.createTextNode(rgb + " " + percentString));
      textArea.value += rgb + "; /* " + percentString + " */\n";
      group.appendChild(title);

      let rectangle = document.createElementNS(svgNS, "rect");
      
      rectangle.setAttribute("x", xPos);
      rectangle.setAttribute("y", "10");
      rectangle.setAttribute("width", 1000 * percent);
      rectangle.setAttribute("height", "80");
      rectangle.setAttribute("fill", rgb);
      // rectangle.setAttribute("stroke", "rgb(128,128,128)");
      xPos += 1000 * percent;
      group.appendChild(rectangle);
      svgArea.appendChild(group);
    });
  } else {
    let xPos = 40;
    sortedColors.forEach( ([color, count]) => {
      let group = document.createElementNS(svgNS, "g");
      let title = document.createElementNS(svgNS, "title");
      let rgb = "rgb(" + color[0] + ", " + color[1] +
        ", " + color[2] + ")"
      title.appendChild(document.createTextNode(rgb));
      textArea.value += rgb + ";\n";
      group.appendChild(title);

      let circle = document.createElementNS(svgNS, "circle");
      
      circle.setAttribute("cx", xPos);
      circle.setAttribute("cy", "40");
      circle.setAttribute("r", "20");
      circle.setAttribute("fill", rgb);
      // circle.setAttribute("stroke", "rgb(128,128,128)");
      xPos += 50;
      group.appendChild(circle);
      svgArea.appendChild(group);
    });
  }
  if (document.getElementById("proportion").value !== "nonprop") {
    let rectangle = document.createElementNS(svgNS, "rect");
    rectangle.setAttribute("x", "9");
    rectangle.setAttribute("y", "9");
    rectangle.setAttribute("width", "1001");
    rectangle.setAttribute("height", "81");
    rectangle.setAttribute("fill", "none");
    rectangle.setAttribute("stroke", "rgb(128, 128, 128)");
    
    svgArea.appendChild(rectangle);
  }

}
