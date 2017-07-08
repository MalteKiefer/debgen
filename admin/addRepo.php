<?php

if(isset($_POST['addRepo']))
{
    if(trim($_POST['title']) != '' OR trim($_POST['desc']) != '' OR trim($_POST['repo']) != '' OR trim($_POST['gpg']) != '' OR trim($_POST['hoempage']) != '' OR trim($_POST['wiki']) != '' OR trim($_POST['release']) != '')
    {
        if($repo->addRepo($_POST['mail']))
        {
            require_once('../tpl/success.addRepo.php'); 
        }
        else
        {
            require_once('../tpl/error.addRepo.php'); 
        }
    }
    else
    {
        require_once('../tpl/error.addRepo.php');   
    }
}

$releases = $release->getRelease();

require_once('../tpl/addRepo.php');


