<div class="container">    
    <div id="loginbox" style="margin-top:10%;" class="mainbox col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">                    
        <div class="panel panel-info" >
            <div class="panel-heading">
                <div class="panel-title">Change Mail</div>
            </div>     
            <div style="padding-top:30px" class="panel-body" >
                <form id="loginform" class="form-horizontal" role="form" method="post">
                    <div style="margin-bottom: 25px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-envelope"></i></span>
                        <input id="login-password" type="text" class="form-control" name="mail" placeholder="<?php echo $email->email;?>">
                    </div>
                    <div style="margin-top:10px" class="form-group">
                        <div class="col-sm-12 controls">
                            <input class="btn btn-success" type="submit" value="change mail" name="changeMail"/>
                        </div>
                    </div>
                </div>
        </div>                     
    </div>  
</div>
