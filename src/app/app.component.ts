import { Component, ElementRef, ViewChild } from '@angular/core';

interface FileWithPreview {
  File: File;
  preview: any;
  width: any;
  height: any;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-image-resizer';

  
  @ViewChild("fileDropRef", { static: false }) fileDropEl: ElementRef;
  files: FileWithPreview[] = [];

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
            console.log("Adding image: ", {
              width: img.width,
              height: img.height,
              src: img.src
            });
            this.files.push({
              File: file,
              //preview: ev.target.result,
              preview: this.resizeImage(img, 500, 500, false, "transparent"),
              width: img.width,
              height: img.height,
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

  resizeImage = ( img: HTMLImageElement, thumbwidth: number, thumbheight: number, crop: boolean, background: string | CanvasGradient | CanvasPattern ) => {
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
    
    return c.toDataURL();
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
