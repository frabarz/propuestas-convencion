# Monitor de Propuestas para la Convención Constitucional

Un experimento para almacenar los avances en las propuestas para la Convención Constitucional, usando Github Flat.

El workflow se ejecuta cada 6 horas y recoge los cambios en las propuestas, que hasta donde tengo entendido son immutables, por lo que la única propiedad que cambia es el número de apoyos.

Para explorar el listado de una forma más eficiente puedes usar el [explorador de repositorios de datos Flat de Github](https://flatgithub.com/frabarz/propuestas-convencion?filename=index.json&sort=supporters%2Cdesc&stickyColumnName=id).

* [Flat Workflow](.github/workflows/flat.yml)
* [Postprocessing script](scripts/index.ts)
