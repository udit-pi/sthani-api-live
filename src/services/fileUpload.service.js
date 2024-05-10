const path = require('path');
const fs = require('fs');
const multer = require('multer');
const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media';


// const uploadSingleFile = (file) => {

//     const fileName = Date.now() + file.originalFilename;
//     // console.log(fileName)
//     const file_path = path.join(__dirname, uploadFolder, fileName);
//     fs.renameSync(file.filepath, file_path); // Move file to desired location
  
//     return fileName

// }

const uploadSingleFile = (file) => {
    const fileName = Date.now() + file.originalFilename;
    const file_path = path.join(uploadFolder, fileName);
    
    // Copy the file to the desired location
    fs.copyFileSync(file.filepath, file_path);

    // Delete the original file
    fs.unlinkSync(file.filepath);

    return fileName;
}




// const uploadMultipleFile = (files) =>  {
//         // console.log(files);
//         const images = []
//         files.map((file,index) => {
//             const fileName = Date.now() + file.originalFilename;
//             const file_path = path.join( uploadFolder, fileName);
//             fs.copyFileSync(file.filepath, file_path); // Move file to desired location
//             fs.unlinkSync(file.filepath);
//             images.push({value:fileName })
           
//         })
    
//         // labels.map((lab,index) => {
//         //     images[index].label = lab 
//         // })
//         return images;
//     }
    


const uploadMultipleFile = (files) => {
    const images = [];
    
    // Ensure files is always treated as an array
    if (!Array.isArray(files)) {
        files = [files];
    }
    
    files.forEach((file, index) => {
        const fileName = Date.now() + file.originalFilename;
        const file_path = path.join(uploadFolder, fileName);
        fs.copyFileSync(file.filepath, file_path); // Move file to desired location
        fs.unlinkSync(file.filepath);
        images.push({ value: fileName });
    });

    return images;
};





// const uploadMultipleFile = (files,labels) =>  {
//     // console.log(files);
//     const images = []
//     files.map((file,index) => {
//         const fileName = Date.now() + file.originalFilename;
//         const file_path = path.join(__dirname, '../uploads', fileName);
//         fs.renameSync(file.filepath, file_path); // Move file to desired location
        
//         images.push({value:fileName })
       
//     })

//     labels.map((lab,index) => {
//         images[index].label = lab 
//     })
//     return images;
// }

const uploadMultipleMediaFiles = (files) => {
   
    const uploadedFiles = []

    if (files) {
        // Check if files is an array
        if (Array.isArray(files)) {
            // Multiple files uploaded
            files.forEach(file => {
                console.log('Array File:', file.originalFilename);
                const fileName = Date.now() + file.originalFilename;
                const file_path = path.join(__dirname, uploadFolder, fileName);
                fs.renameSync(file.filepath, file_path); // Move file to desired location
               
                uploadedFiles.push(fileName)
            });
        } else {
            // Single file uploaded
            console.log('File:', files.originalFilename);
            const fileName = Date.now() + files.originalFilename;
            const file_path = path.join(__dirname,uploadFolder, fileName);
            fs.renameSync(files.filepath, file_path); // Move file to desired location
               
            uploadedFiles.push(fileName)
            
        }
    } else {
        // No files uploaded
        return res.status(400).json({ error: 'No files uploaded' });
    }
    // files.map((file,index) => {
    //     const fileName = Date.now() + file.originalFilename;
    //     const file_path = path.join(__dirname, '../uploads', fileName);
    //     fs.renameSync(file.filepath, file_path); // Move file to desired location
    //     console.log(files)
    //     uploadedFiles.push(fileName)
       
       
    // })
    return uploadedFiles;
}

module.exports = {
    uploadSingleFile,
    uploadMultipleFile,
    uploadMultipleMediaFiles
}
