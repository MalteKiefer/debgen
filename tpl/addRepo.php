<div class="container">    
    <div id="loginbox" style="margin-top:10%;" class="mainbox col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">                    
        <div class="panel panel-info" >
            <div class="panel-heading">
                <div class="panel-title">Add Repo</div>
            </div>     
            <div style="padding-top:30px" class="panel-body" >
                <form id="loginform" class="form-horizontal" role="form" method="post">
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-envelope"></i></span>
                        <input id="login-password" type="text" class="form-control" name="title" placeholder="title">
                    </div>
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-envelope"></i></span>
                        <textarea rows="5" class="form-control" name="desc" placeholder="desc"></textarea>
                    </div>
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-hdd"></i></span>
                        <input id="login-password" type="text" class="form-control" name="repo" placeholder="repo">
                    </div>
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-hdd"></i></span>
                        <input id="login-password" type="text" class="form-control" name="reposrc" placeholder="repo src">
                    </div>
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-lock"></i></span>
                        <input id="login-password" type="text" class="form-control" name="gpg" placeholder="gpg">
                    </div>
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-globe"></i></span>
                        <input id="login-password" type="text" class="form-control" name="homepage" placeholder="homepage">
                    </div>
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-book"></i></span>
                        <input id="login-password" type="text" class="form-control" name="wiki" placeholder="wiki">
                    </div>
                    <div style="margin-bottom: 10px" class="input-group">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-cd"></i></span>
                          <select multiple class="form-control" name="release">
                          <?php
                            foreach($releases as $dataOut)
                            {
                                echo "<option value='$dataOut[release_id]'>$dataOut[release_name]</option>";
                            }
                          ?>
                          </select>
                    </div>
                    <div style="margin-top:10px" class="form-group">
                        <div class="col-sm-12 controls">
                            <input class="btn btn-success" type="submit" value="add repo" name="addRepo"/>
                        </div>
                    </div>
                </div>
        </div>                     
    </div>  
</div>
