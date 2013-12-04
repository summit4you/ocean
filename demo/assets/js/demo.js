var DEMO =
{
	ms_Canvas: null,
	ms_Renderer: null,
	ms_Camera: null, 
	ms_Scene: null, 
	ms_Controls: null,
	ms_IsDisplaying: false,
	ms_Water: null,
	
	Enable: ( function() 
	{
        try 
		{
			var aCanvas = document.createElement( 'canvas' ); 
			return !! window.WebGLRenderingContext && ( aCanvas.getContext( 'webgl' ) || aCanvas.getContext( 'experimental-webgl' ) ); 
		} 
		catch( e ) { return false; } 
	} )(),
	
	Initialize: function( inIdCanvas, inParameters )
	{
		this.ms_Canvas = $( '#'+inIdCanvas );
		
		// Initialize Renderer, Camera and Scene
		this.ms_Renderer = this.Enable? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
		this.ms_Canvas.html( this.ms_Renderer.domElement );
		this.ms_Scene = new THREE.Scene();
		
		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 3000000 );
		this.ms_Camera.position.set( inParameters.width / 2, Math.max( inParameters.width, inParameters.height ) / 1.5, -inParameters.height / 1.5 );
		this.ms_Camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
		
		// Initialize Orbit control		
		this.ms_Controls = new THREE.OrbitControls( this.ms_Camera, this.ms_Renderer.domElement );
		this.ms_Controls.userPanSpeed = 10.0;
		
		console.log( this.ms_Controls );
	
		// Add light
		var directionalLight = new THREE.DirectionalLight( 0xffff55, 1.3 );
		directionalLight.position.set( -600, 300, 600 );
		this.ms_Scene.add( directionalLight );
		
		// Create terrain
		this.LoadTerrain( inParameters );
		
		// Load textures
		var noiseTexture = new THREE.ImageUtils.loadTexture( 'images/cloud.png' );
		noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
		
		var waterNormals = new THREE.ImageUtils.loadTexture( 'images/waternormals.png' );
		waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; 
		
		// Create the water effect
		this.ms_Water = new THREE.Water( this.ms_Renderer, this.ms_Camera, {
			textureWidth: 512, 
			textureHeight: 512,
			noiseTexture: noiseTexture,
			waterNormals: waterNormals,
			alpha: 	1.0,
			sunDirection: directionalLight.position.normalize(),
			sunColor: 0xffffff,
			waterColor: 0x001e0f,
		} );
		var aMeshMirror = new THREE.Mesh(
			new THREE.PlaneGeometry( inParameters.width * 500, inParameters.height * 500, 100, 100 ), 
			this.ms_Water.material
		);
		aMeshMirror.add( this.ms_Water );
		aMeshMirror.rotation.x = - Math.PI * 0.5;
		aMeshMirror.position.y = - inParameters.depth * 0.1;
		this.ms_Scene.add( aMeshMirror );
	
		this.LoadSkyBox();
	},
	
	LoadSkyBox: function()
	{
		var aCubeMap = THREE.ImageUtils.loadTextureCube( [
		  'assets/img/px.jpg',
		  'assets/img/nx.jpg',
		  'assets/img/py.jpg',
		  'assets/img/ny.jpg',
		  'assets/img/pz.jpg',
		  'assets/img/nz.jpg'
		] );
		aCubeMap.format = THREE.RGBFormat;

		var aShader = THREE.ShaderLib['cube'];
		aShader.uniforms['tCube'].value = aCubeMap;

		var aSkyBoxMaterial = new THREE.ShaderMaterial( {
		  fragmentShader: aShader.fragmentShader,
		  vertexShader: aShader.vertexShader,
		  uniforms: aShader.uniforms,
		  depthWrite: false,
		  side: THREE.BackSide
		});

		var aSkybox = new THREE.Mesh(
		  new THREE.CubeGeometry( 1000000, 1000000, 1000000 ),
		  aSkyBoxMaterial
		);
		
		this.ms_Scene.add( aSkybox );
	},
	
	LoadTerrain: function( inParameters )
	{
		var terrainGeo = TERRAINGEN.Get( inParameters );
		var terrainMaterial = new THREE.MeshPhongMaterial( { vertexColors: THREE.VertexColors, shading: THREE.FlatShading, side: THREE.DoubleSide } );
		
		var terrain = new THREE.Mesh( terrainGeo, terrainMaterial );
		terrain.position.y = - inParameters.depth / 2;
		this.ms_Scene.add( terrain );
	},
	
	Display: function()
	{
		this.ms_Water.render();
		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );
	},
	
	Update: function()
	{
		this.ms_Water.material.uniforms.time.value += 0.013;
		this.ms_Controls.update();
		this.Display();
	},
	
	Resize: function( inWidth, inHeight )
	{
		this.ms_Camera.aspect =  inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize( inWidth, inHeight );
		this.ms_Canvas.html( this.ms_Renderer.domElement );
		this.Display();
	}
};