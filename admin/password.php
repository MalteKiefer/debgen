<?php

if(isset($_POST['changePassword']))
{
    if((trim($_POST['passwordRepeat']) == trim($_POST['password'])) AND trim($_POST['password']) != '')
    {
        if($user->changePassword($_POST['password']))
        {
            require_once('../tpl/success.password.php'); 
        }
        else
        {
            require_once('../tpl/error.password.php'); 
        }
    }
    else
    {
        require_once('../tpl/error.password.php');   
    }
}

require_once('../tpl/password.php');


