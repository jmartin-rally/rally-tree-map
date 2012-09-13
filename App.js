/*global console, Ext, $jit */
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        this._getData();
    },
    items: [{ xtype: 'container', itemId: 'tree_box', id: 'tree_box', width: 500, height: 500 }],
    _getData: function() {
        Ext.create( 'Rally.data.WsapiDataStore', {
            model: 'User Story',
            listeners: { 
                load: function( store, data, success ) {
                    this._formatData(data);

                },
                scope: this
            },
            fetch: [ 'Name', 'FormattedID', 'Parent', 'PlanEstimate', 'ScheduleState' ],
            autoLoad: true
        });
    },
    _formatData: function(data) {
        /*
         * expects the data in a json string that looks like
           var json = {  
			  "children": [  
			   {  
			     "children": [  
			       {  
			         "children": [],   
			         "data": {  
			           "playcount": "276",   
			           "$color": "#8E7032",   
			           "image": "http://userserve-ak.last.fm/serve/300x300/11403219.jpg",   
			           "$area": 276  
			         },  
			         
			         etc...
         */ 
        
        var item_hash = {};
        var MINIMUM_AREA = 1;
        var COLORS = { "Accepted": "#3A874F", "Completed": "#6AB17D", "In-Progress": "#B2E3B6", "Defined": "#E0E0E0", "Backlog": "f1f1f1" } ;
        
	    Ext.Array.each( data, function( item_container ) {
	        var item = item_container.data;
            item_hash[item.FormattedID] = {
                "children": [],
                "data": {
                    "$area": item.PlanEstimate * 10 || MINIMUM_AREA * 10,
                    "$color": COLORS[item.ScheduleState] || "#0ff",
                    "PlanEstimate": item.PlanEstimate,
                    "ScheduleState": item.ScheduleState
                },
                "id": item.FormattedID,
                "name": item.FormattedID + ":" + item.Name
            };
	    });
        
        var top_level_node = {
            "children": [],
            "data": {},
            "id": "root",
            "name": "Top Box"
        };
        
        Ext.Array.each( data, function( item_container ) {
            var item = item_container.data;
            var parent = item.Parent;
            
            if ( parent ) {	            
	            if ( ! item_hash[ parent.FormattedID ] ) {
	                item_hash[parent.FormattedID] = {
	                    "children": [],
		                "data": {
		                    "$area": MINIMUM_AREA * 10,
		                    "$color": "#0ff"
		                },
		                "id": parent.FormattedID,
		                "name": parent.FormattedID + ":" + parent.Name
	                };
                    top_level_node.children.push( item_hash[parent.FormattedID ] );
	            }
	            item_hash[parent.FormattedID].children.push( item_hash[ item.FormattedID ] );
            } else {
                top_level_node.children.push( item_hash[ item.FormattedID ] );
            }
        });
        this._makeTreeMap( top_level_node );
    },
    _makeTreeMap: function( data ) {

        var treeMap = new $jit.TM.Squarified({
            injectInto: "tree_box",
            titleHeight: 15,
            animate: true,
            offset: 1,
            Events: {
                enable: true,
                onClick: function(node) {
                    if(node) treeMap.enter(node);
                    
                },
                onRightClick: function() {
                    treeMap.out();
                }
            },
            Tips: {  
				enable: true,  
				//add positioning offsets  
				offsetX: 20,  
				offsetY: 20,  
				//implement the onShow method to  
				//add content to the tooltip when a node  
				//is hovered  
				onShow: function(tip, node, isLeaf, domElement) {  
				    var html = "<div class=\"tip-title\">" + node.name + "</div><div class=\"tip-text\">";  
				    var data = node.data; 
                    
                    if ( data.PlanEstimate ) {
                        html += "<br/>Plan Estimate: " + data.PlanEstimate;
                    }
                    
                    if ( data.ScheduleState ) {
                        html += "<br/>Schedule State: " + data.ScheduleState;
                    }
                    
                    tip.innerHTML = html;
                }
			  },  
			  //Add the name of the node in the correponding label  
			  //This method is called once, on label creation.  
			  onCreateLabel: function(domElement, node){  
		          var name = node.name;
		          if ( name.length > 5 ) { 
		              name = name.substring(0,5) + "...";
		          }
			      domElement.innerHTML = name;
			      var style = domElement.style;  
			      style.display = '';  
			      style.border = '1px solid transparent';  
			      domElement.onmouseover = function() {  
			        style.border = '1px solid #9FD4FF';  
			      };  
			      domElement.onmouseout = function() {  
			        style.border = '1px solid transparent';  
			      };
                  
		      }  
        });
        
        treeMap.loadJSON(data);
        treeMap.refresh();
    }
});
