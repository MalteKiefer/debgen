  
    We add the source code to GitHub. Please take a look: <!-- Place this tag where you want the button to render. -->
<!-- Place this tag where you want the button to render. -->
<a class="github-button" href="https://github.com/beli3ver/debgen/subscription" data-count-href="/beli3ver/debgen/watchers" data-count-api="/repos/beli3ver/debgen#subscribers_count" data-count-aria-label="# watchers on GitHub" aria-label="Watch beli3ver/debgen on GitHub">Watch</a>

    <form action="index.php?generate" method="post" name="generate">
        <p><label><input name="debFast" id="debFast" type="checkbox" checked /> Use <a href="https://deb.debian.org" target="_blank">deb.debian.org</a> (Fast Server Select) service?</label><br></p>
				<div class="elemnts--inline">
					<div class="footerdiv">
						<p><label>Mirror<br>
						<select name="country" id="country" disabled>
						<?php
							foreach($main_deb_server as $country => $server )
							{
									echo "<option value='$server'>$country</option>";
							}
						?>				
						</select></label></p>
						
						<p><label>Release<br>
						<select name="release" id="release">
							<option value="" selected>Please select...</option>
						<?php
							foreach($release as $out )
							{
									echo "<option value='$out[release_code]' data-id='$out[release_id]'>$out[release_name]</option>";
							}
						?>				
						</select></label></p>
						<br />

					<p><label><input name="src" type="checkbox" checked id="source"> Include source</label><br>
						<label><input name="contrib" type="checkbox" checked id="contrib"> Contrib</label><br>
						<label><input name="non-free" type="checkbox" checked id="non-free"> Non-Free</label><br>
						<label><input name="security" type="checkbox" checked id="security"	> Security</label><br />
						<label><input name="updates" type="checkbox" checked id="updates"> Updates</label><br />
						<label><input name="backports" type="checkbox" checked id="backports"> Backports</label></p>
					</div>
					<p><label>3rd Parties Repos</label></p><br />
					<script>
              $("#debFast").on('click', function(){
                if ( $(this).is(':checked') ) {
                  $('#country').prop('disabled', true);
                } 
                else {
                  $('#country').prop('disabled',false);
                }
              });
					$("#release").change(function(){
						if($("#release").val() == "unstable")
						{
							$('#security').prop('disabled', true);
							$('#security').prop('checked', false);
							$('#updates').prop('disabled', true);
							$('#updates').prop('checked', false);
							$('#backports').prop('disabled', true);
							$('#backports').prop('checked', false);
						}
						else if($("#release").val() == "testing")
						{
							$('#security').prop('disabled', false);
							$('#security').prop('checked', true);
							$('#updates').prop('disabled', false);
							$('#updates').prop('checked', true);
							$('#backports').prop('disabled', true);
							$('#backports').prop('checked', false);							
						}
						else
						{
							$('#security').prop('disabled', false);
							$('#security').prop('checked', true);
							$('#updates').prop('disabled', false);
							$('#updates').prop('checked', true);	
							$('#backports').prop('disabled', false);
							$('#backports').prop('checked', true);						
						}
						$(".button").prop('disabled', false);
						$.getJSON("api.php?get_repos&release_id="+$("#release").find(":selected").data('id'), function(result){
							$(".repos").empty();
							$.each(result, function(k, v){
								$( ".repos" ).append('<div class="repo"></div><p><label><input name="3rdparties[]" type="checkbox" value="'+v.repo_id+'"> '+v.repo_name+'</label>&nbsp;&nbsp;<a href="'+v.repo_homepage+'" target="_blank"  class="link"><i class="icon ion-earth"> Homepage</i></a>&nbsp;&nbsp;<a href="'+v.repo_documentation+'"  target="_blank" class="link"><i class="icon ion-university"> Documentation</i></a>');
								$( ".repos" ).append('<div class="inside">'+v.repo_desc+'');
								$( ".repos" ).append('<a href="#" onClick="brokenRepo(' + v.repo_id + ');" class="link right"><i class="icon ion-flash-off"> Broken Repo</i></a></div></p></div><br />');								
							});
						});

					});
					</script>
					<div class="repos">
					
					</div>	
					
					<p><button class="button" disabled>Generate</button></p>
					<script>
						$(".button").submit();
					</script>
				</div>
				</form>
