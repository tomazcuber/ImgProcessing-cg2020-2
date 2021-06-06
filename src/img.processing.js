(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.ImageProcessing = {}));
}(this, (function (exports) { 'use strict';



    function ImageProcesser(img, kernel = null, xform = null, bhandler = 'icrop') {
        this.img = img.clone();
        this.width = img.shape[1];
        this.height = img.shape[0];
        this.kernel = kernel;
        this.xform = xform;
        this.bhandler = bhandler;
    }

    Object.assign( ImageProcesser.prototype, {

        apply_kernel: function(border = 'icrop') {
            // Method to apply kernel over image (incomplete)
            // border: 'icrop' is for cropping image borders, 'extend' is for extending image border
            // You may create auxiliary functions/methods if you'd like
            let transformedImg
            if(border == 'icrop'){
                console.log("Cropping image borders");
                transformedImg = nj.zeros([this.height - 2,this.width - 2]);
            } else if(border == 'extend'){
                
                transformedImg = nj.zeros([this.height,this.width]);
                let extendedImg = nj.zeros([this.height + 2, this.width + 2]);
                
                // Extende os cantos 
                extendedImg.set(0,0,this.img.get(0,0));
                extendedImg.set(0,extendedImg.shape[1],this.img.get(0,this.width));
                extendedImg.set(extendedImg.shape[0],0,this.img.get(this.height, 0));
                extendedImg.set(extendedImg.shape[0],extendedImg.shape[1], this.img.get(this.height,this.width));
                
                // Extende a primeira e última linha
                for(let j = 0; j <= this.width; j++){
                    extendedImg.set(0,j,this.img.get(0,j));
                    extendedImg.set(extendedImg.shape[0],j,this.img.get(this.height,j));
                }

                // Extende a primeira e última coluna
                for(let i = 0; i < this.height; i++){
                    extendedImg.set(i, 0, this.img.get(i,0));
                    extendedImg.set(i, extendedImg.shape[1], this.img.get(i,this.width));
                }

                // Copia a imagem para o centro da imagem extendida
                for(let j = 0; j <= this.width; j++){
                    for(let i = 0; i < this.height; i++){
                        extendedImg.set(i+1,j+1,this.img.get(i,j));
                    }
                }
                
                this.img = extendedImg.clone();             
            }

            switch(this.kernel){
                case "box":
                    console.log("Applying box filter");
                    for(let i = 0; i < transformedImg.shape[0]; i++){
                        for(let j = 0; j < transformedImg.shape[1]; j++){
                            let convolutionResult = 0;
                            
                            for(let u = 0; u < 3; u++){
                                for(let v = 0; v < 3; v++){
                                    convolutionResult += this.img.get(u + i,v + j) * this.boxFilterKernel.get(u,v);
                                }
                            }
                            transformedImg.set(i,j,convolutionResult);
                        }
                    }
                    break;

                case "sobel":
                    let derivedImgOnX = transformedImg.clone();
                    let derivedImgOnY = transformedImg.clone();
                    
                    for(let i = 0; i < derivedImgOnX.shape[0]; i++){
                        for(let j = 0; j < derivedImgOnX.shape[1]; j++){
                            let convolutionResult = 0;
                            
                            for(let u = 0; u < 3; u++){
                                for(let v = 0; v < 3; v++){
                                    convolutionResult += this.img.get(u + i,v + j) * this.sobelXFilterKernel.get(u,v);
                                }
                            }
                            derivedImgOnX.set(i,j,convolutionResult);
                        }
                    }

                    for(let i = 0; i < derivedImgOnY.shape[0]; i++){
                        for(let j = 0; j < derivedImgOnY.shape[1]; j++){
                            let convolutionResult = 0;
                            
                            for(let u = 0; u < 3; u++){
                                for(let v = 0; v < 3; v++){
                                    convolutionResult += this.img.get(u + i,v + j) * this.sobelYFilterKernel.get(u,v);
                                }
                            }
                            derivedImgOnY.set(i,j,convolutionResult);
                        }
                    }

                    let gradientMagnitude = transformedImg.clone();
                    
                    for(let i = 0; i < transformedImg.shape[0]; i++){
                        for(let j = 0; j < transformedImg.shape[1]; j++){

                            gradientMagnitude = Math.sqrt(Math.pow(derivedImgOnX.get(i,j),2) + Math.pow(derivedImgOnY.get(i,j),2));

                            transformedImg.set(i,j,gradientMagnitude);
                        }
                    }

                    break;

                case "laplace":
                    console.log("Applying laplace filter");

                    for(let i = 0; i < transformedImg.shape[0]; i++){
                        for(let j = 0; j < transformedImg.shape[1]; j++){
                            let convolutionResult = 0;
                            
                            for(let u = 0; u < 3; u++){
                                for(let v = 0; v < 3; v++){
                                    convolutionResult += this.img.get(u + i,v + j) * this.laplaceFilterKernel.get(u,v);
                                }
                            }
                            transformedImg.set(i,j,convolutionResult);
                        }
                    }
                
                
                    break;

                default:
                    console.log("No filter to apply");
                    break;
            }

            this.img = transformedImg;
            console.log(this.img.shape);
        },

        boxFilterKernel: nj.array([[1/9,1/9,1/9],
                                    [1/9,1/9,1/9],
                                    [1/9,1/9,1/9]]),

        sobelXFilterKernel: nj.array([[-1,0,1], 
                                      [-2,0,2],
                                      [-1,0,1]]).multiply(1/8),

        sobelYFilterKernel: nj.array([[1,2,1], 
                                       [0,0,0],
                                       [-1,-2,-1]]).multiply(1/8),

        laplaceFilterKernel: nj.array([[0,-1,0],
                                      [-1,4,-1],
                                      [0,-1,-1]]).multiply(1/4),


        apply_xform: function()  {
            // Method to apply affine transform through inverse mapping (incomplete)
            // You may create auxiliary functions/methods if you'd like
        },

        update: function() {
            // Method to process image and present results
            var start = new Date().valueOf();

            if(this.kernel != null) {
                this.apply_kernel(this.bhandler);
            }

            if(this.xform != null) {
                this.apply_xform();
            }

            // Loading HTML elements and saving
            var $transformed = document.getElementById('transformed');
            $transformed.width = this.width; 
            $transformed.height = this.height;
            nj.images.save(this.img, $transformed);
            var duration = new Date().valueOf() - start;
            document.getElementById('duration').textContent = '' + duration;
        }

    } )


    exports.ImageProcesser = ImageProcesser;
    
    
})));

