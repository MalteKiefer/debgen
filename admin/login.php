<?php

require_once('tpl/header.tpl');

if(isset($_POST["loginUser"]))
{
    $user = new User($conn);
    $user->USERNAME = $_POST["username"];
    $user->PASSWORD = $_POST["password"];
    
    if($user->login())
    {
        header('Location: index.php');
    }
    else
    {
        require_once('tpl/login.err.tpl');
        require_once('tpl/login.tpl');
    }
}
else
{
    require_once('tpl/login.tpl');
}

require_once('tpl/footer.tpl');
