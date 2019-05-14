<div class="container">    
    <div id="loginbox" style="margin-top:10%;" class="mainbox col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">                    
        <div class="panel panel-info" >
            <div class="panel-heading">
                <div class="panel-title">Change Notify Status</div>
            </div>     
            <div style="padding-top:30px" class="panel-body" >
                <form id="loginform" class="form-horizontal" role="form" method="post">
                    <input type="checkbox" name="notify" <?php if($notify->notify) echo "checked";?> autocomplete="off"> Select this box if you want to be notified when a repo is reported as broken.
                    <div style="margin-top:10px" class="form-group">
                        <div class="col-sm-12 controls">
                            <input class="btn btn-success" type="submit" value="change notify status" name="changeNotify"/>
                        </div>
                    </div>
                </div>
        </div>                     
    </div>  
</div>
