<ul class="sourcenav">
    <li><table><tr><td><img src="images/lastfm.png"></td><td><h3>Last.FM Personal Radio</h3></td></tr></table></li>
    <li><a href="#" onclick="doLastFM('lastfmuser', lastfm.username())">Library Radio</a></li>
    <li><a href="#" onclick="doLastFM('lastfmmix', lastfm.username())">Mix Radio</a></li>
    <li><a href="#" onclick="doLastFM('lastfmrecommended', lastfm.username())">Recommended Radio</a></li>
    <li><a href="#" onclick="doLastFM('lastfmneighbours', lastfm.username())">Neighbourhood Radio</a></li><br>
    <li><b>Last.FM Artist Radio</b></li>
    <li>
        <input class="sourceform" id="lastfmartist" type="text" size="60"/>
        <button class="topformbutton" onclick="doLastFM('lastfmartist')">Play</button>
    </li>
    <li><b>Last.FM Artist Fan Radio</b></li>
    <li>
        <input class="sourceform" id="lastfmfan" type="text" size="60"/>
        <button class="topformbutton" onclick="doLastFM('lastfmfan')">Play</button>
    </li>
    <li><b>Last.FM Global Tag Radio</b></li>
    <li>
        <input class="sourceform" id="lastfmglobaltag" type="text" size="60"/>
        <button class="topformbutton" onclick="doLastFM('lastfmglobaltag')">Play</button>
    </li>
    <li>
        <a name="friends" style="padding-left:0px" class="toggle" href="#" onclick="getFriends()"><img src="images/toggle-closed.png"></a><b>Friends</b></li>
        <div id="albummenu" name="friends"></div>
    </li>
    <li>
        <a name="neighbours" style="padding-left:0px" class="toggle" href="#" onclick="getNeighbours()"><img src="images/toggle-closed.png"></a><b>Neighbours</b></li>
        <div id="albummenu" name="neighbours"></div>
    </li>
</ul>
