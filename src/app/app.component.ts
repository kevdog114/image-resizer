import { Component, ElementRef, ViewChild } from '@angular/core';

interface FileWithPreview {
  File: File;
  preview: any;
  width: any;
  height: any;
  widthNew: number;
  heightNew: number;
  sizeNew: number;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-image-resizer';

  private LOCALSTORAGE_Keys = {
    SelectedResizeOption: "selectedResizeOption",
    CustomSize: "customSize"
  };

  sizeOptions = [
    { id: "1", value: "500x500 px", resizeHeight: 500, resizeWidth: 500 },
    { id: "2", value: "1024x1024 px", resizeHeight: 1024, resizeWidth: 1024 },
    { id: "3", value: "2048x2048 px", resizeHeight: 2048, resizeWidth: 2048 },
    { id: "4", value: "Custom Size", resizeHeight: null, resizeWidth: null, isCustom: true }
  ];
  selectedSize: string;
  
  @ViewChild("fileDropRef", { static: false }) fileDropEl: ElementRef;
  files: FileWithPreview[] = [];

  constructor() {
    var previousValue = localStorage.getItem(this.LOCALSTORAGE_Keys.SelectedResizeOption);
    if(previousValue !== null && this.sizeOptions.filter(a => a.id == previousValue)) {
      this.selectedSize = previousValue;
    }
    var previousCustomSize = localStorage.getItem(this.LOCALSTORAGE_Keys.CustomSize);
    if(previousCustomSize !== null)
      this.handleCustomSize(previousCustomSize);
  }

  clearStorage = () => {
    localStorage.clear();
  }
  /**
   * on file drop handler
   */
  onFileDropped($event: FileList) {
    console.log($event);
    this.prepareFilesList($event);
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(files) {
    this.prepareFilesList(files);
  }

  selectOption = (option) => {
    this.selectedSize = option.id;
    localStorage.setItem(this.LOCALSTORAGE_Keys.SelectedResizeOption, this.selectedSize);
  }

  sizeButtonClick = (option) => {
    if(option.isCustom)
      this.createCustomSize();
      
    this.selectOption(option);
  }

  createCustomSize = () => {
    let customSize = prompt(`Please enter a custom image size, in pixels. Please use this exact format: "{width},{height}", or "{side}" if width and height are the same.
    Example: "250,350" to resize to 250px wide by 350px height.
    Example: "250" to resize to 250px wide by 250px height.
    `);

    this.handleCustomSize(customSize);
  }

  private handleCustomSize = (sz: string) => {
    if(sz != null) {

      var parsedCustomSize = this.parseCustomSize(sz);

      if(parsedCustomSize === null)
        return;

      console.log("Custom size parsed", parsedCustomSize);
      var selectedOption = this.sizeOptions.filter(a => a.isCustom)[0];
      selectedOption.resizeHeight = parsedCustomSize.height;
      selectedOption.resizeWidth = parsedCustomSize.width;

      localStorage.setItem(this.LOCALSTORAGE_Keys.CustomSize, sz);
    }
  }

  private parseCustomSize = (sz: string) => {
    
    var matches = sz.match(/(\d+)(,(\d+))?/);
    console.log(matches);

    // match[1] contains the width (or side, if the height isn't specified)
    // match[2] contains the height (if specified)
    let width = matches[1] === undefined ? 0 : Number(matches[1]);
    let height = matches[3] === undefined ? undefined : Number(matches[3]);
    let isBad = false;
    if(width < 50 || width > 5000) {
      isBad = true;
      alert("The width was outside the allowed range of 50px to 5000px");
    }
    if(height !== null && (height < 50 || height > 5000)) {
      isBad = true;
      alert("The height was outside the allowed range of 50px to 5000px");
    }

    console.log(height);
    
    if(isBad) {
      this.selectOption(this.sizeOptions[0]);
      return null;
    }

    if(height !== undefined)
      return {
        width: width,
        height: height
      };
    else
      return {
        width: width,
        height: width
      };
  }

  /**
   * Convert Files list to normal array list
   * @param files (Files List)
   */
  prepareFilesList(files: FileList) {
    for (var idx = 0; idx < files.length; idx++) {
      var item = files[idx];

      if(item.type.indexOf('image') === -1)
        continue;
      
      var reader = new FileReader();
      reader.readAsDataURL(item);

      var imageOnLoad = (file: File) => {
        return (ev) => {
          console.log(ev);
          let img = new Image();
          img.src = ev.target.result as string;


          img.onload = () => {

            var selectedSizeElement = this.sizeOptions.filter(a => a.id == this.selectedSize);
            var resizeHeight: number = 500;
            var resizeWidth: number = 500;
            if(selectedSizeElement != null && selectedSizeElement.length > 0)
            {
              resizeHeight = selectedSizeElement[0].resizeHeight;
              resizeWidth = selectedSizeElement[0].resizeWidth; 
            }
            var resizedImg = this.resizeImage(img, resizeWidth, resizeHeight, false, "transparent", file.type);

            this.files.push({
              File: file,
              //preview: ev.target.result,
              preview: resizedImg.image,
              width: img.width,
              height: img.height,
              widthNew: Math.round(resizedImg.dimensions.w),
              heightNew: Math.round(resizedImg.dimensions.h),
              sizeNew: atob(resizedImg.image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')).length
            });
          }
        };
      }

      var processImage = (file: File) => {
        reader.onload = imageOnLoad(file);
      };
      
      processImage(item);

    }
    setTimeout(() => {
      this.fileDropEl.nativeElement.value = "";
    }, 3000);
  }

  resizeImage = ( img: HTMLImageElement, thumbwidth: number, thumbheight: number, crop: boolean, background: string | CanvasGradient | CanvasPattern, imageMimeType: string ) => {
    var c = document.createElement("canvas");
    var cx = c.getContext("2d");

    c.width = thumbwidth;
    c.height = thumbheight;
    var dimensions = this.resize( img.width, img.height, thumbwidth, thumbheight );
    if ( crop ) {
      c.width = dimensions.w;
      c.height = dimensions.h;
      dimensions.x = 0;
      dimensions.y = 0;
    }
    if ( background !== 'transparent' ) {
      cx.fillStyle = background;
      cx.fillRect ( 0, 0, thumbwidth, thumbheight );
    }
    cx.drawImage(
      img, dimensions.x, dimensions.y, dimensions.w, dimensions.h
    );
    
    return {
      image: c.toDataURL(imageMimeType),
      dimensions: dimensions
    };
  };

  resize = ( imagewidth, imageheight, thumbwidth, thumbheight ) => {
    var w = 0, h = 0, x = 0, y = 0,
        widthratio  = imagewidth / thumbwidth,
        heightratio = imageheight / thumbheight,
        maxratio    = Math.max( widthratio, heightratio );
    if ( maxratio > 1 ) {
        w = imagewidth / maxratio;
        h = imageheight / maxratio;
    } else {
        w = imagewidth;
        h = imageheight;
    }
    x = ( thumbwidth - w ) / 2;
    y = ( thumbheight - h ) / 2;
    return { w:w, h:h, x:x, y:y };
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
}
