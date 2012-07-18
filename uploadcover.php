<?php
//error_log("Upload File");
$fname = rawurldecode($_POST['key']);
$origname = $_FILES['ufile']['name'];
$matches = array();
preg_match('/\.(.*?)$/', basename($origname), $matches);
$file_extension = $matches[1];
$uploadfile = "prefs/".$fname.".".$file_extension;

//error_log("Uploaded File is ".$uploadfile);

if (move_uploaded_file($_FILES['ufile']['tmp_name'], $uploadfile)) {
//    error_log("File is valid, and was successfully uploaded.");
} else {
    error_log("Possible file upload attack!");
    return 0;
}

$main_file = "albumart/original/".$fname.".jpg";
$small_file = "albumart/small/".$fname.".jpg";

if (file_exists($main_file)) {
    unlink($main_file);
}
if (file_exists($small_file)) {
    unlink($small_file);
}

// Test to see if convert is on the path and adjust if not - this makes
// it work on MacOSX when everything's installed from MacPorts
$convert_path = "convert";
$a = 1;
system($convert_path, &$a);
if ($a == 127) {
    //error_log("Trying MacPorts installation of convert");
    $convert_path = "/opt/local/bin/convert";
}

$r = system( $convert_path.' "'.$uploadfile.'" "'.$main_file.'"');
//error_log($r);
$r = system( $convert_path.' -resize 32x32 "'.$uploadfile.'" "'.$small_file.'"');
//error_log($r);
unlink($uploadfile);

include("albumart.php");

?>
