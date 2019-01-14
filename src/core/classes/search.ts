import * as nt from "./dynamicgraph"
import * as nt_u from "./utils"
import * as nt_q from "./queries"

export namespace networkcube{
	
		
	export function searchForTerm(term:string, dgraph:nt.networkcube.DynamicGraph, type?:string):nt_u.networkcube.IDCompound{
		var terms = term.toLowerCase().split(',');
        
		var result:nt_u.networkcube.IDCompound = new nt_u.networkcube.IDCompound();
		
		
		for(var i=0 ; i < terms.length ; i++){
			term = terms[i].trim();
			console.log('search term', term)
			if(!type || type == 'node')
				result.nodeIds = result.nodeIds.concat(dgraph.nodes().filter(
					(e:nt_q.networkcube.Node)=>
						e.label().toLowerCase().indexOf(term) > -1
						|| e.nodeType().toLowerCase().indexOf(term) > -1       
					).ids());				
			if(!type || type == 'link')
				result.linkIds = result.linkIds.concat(dgraph.links().filter(
					(e:nt_q.networkcube.Link)=>
						e.source.label().toLowerCase().indexOf(term) > -1
						|| e.target.label().toLowerCase().indexOf(term) > -1
						|| e.linkType().indexOf(term) > -1
					).ids());				
			if(!type || type == 'locations')
				result.locationIds = result.locationIds.concat(dgraph.locations().filter(
					(e:nt_q.networkcube.Location)=>
						e.label().toLowerCase().indexOf(term) > -1       
					).ids());				
		}
		return result;
	}
	
	
	
	/// FILTERS
	
	export interface IFilter{
		test(o:any):boolean;
	}
	
	class StringContainsFilter{
		pattern:string;
		constructor(pattern:string){
			this.pattern = pattern;
		}
		
		test(word:any){
			console.log('contains:' ,word, this.pattern)
			return word.indexOf(this.pattern) > -1;
		}	
	}
	
}