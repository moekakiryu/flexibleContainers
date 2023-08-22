import ViewController from 'components/ViewController'

const defaultLayout = {
  children: [
    {
      id: 'v1',
      width: ( 1 / 4 ),
      height: 1,
    },
    {
      id: 'c2',
      width: ( 1 / 2 ),
      height: 1,
      children: [
        {
          id: 'c2v1',
          width: 1,
          height: ( 1 / 3 ),
        },
        {
          id: 'c2v2',
          width: 1,
          height: ( 5 / 12 )
        },
        {
          id: 'c2v3',
          width: 1,
          height: ( 1 / 4 )
        }
      ]
    },
    {
      id: 'c3',
      width: ( 1 / 4 ),
      height: 1,
      children: [
        {
          id: 'c3r1',
          width: 1,
          height: ( 1 / 4 ),
          children: [
            {
              id: 'c3r1v1',
              width: ( 1 / 2 ),
              height: 1
            },
            {
              id: 'c3r1v2',
              width: ( 1 / 2 ),
              height: 1
            },
          ]
        },
        {
          id: 'c3v2',
          width: 1,
          height: ( 3 / 4 ),
        }
      ]
    }
  ]
}

function App() {
  return (
    <ViewController
      controllerId="root"
      layout={defaultLayout}
    />
  );
}

export default App;
