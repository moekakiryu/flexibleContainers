import ViewController from "components/ViewController";

const defaultLayout = {
  children: [
    {
      id: 'c1',
      width: ( 1 / 4 ),
      height: 1,
    },
    {
      id: 'c2',
      width: ( 1 / 2 ),
      height: 1,
      children: [
        {
          id: 'c1r1',
          width: 1,
          height: ( 2 / 3 ),
        },
        {
          id: 'c1r2',
          width: 1,
          height: ( 1 / 3)
        }
      ]
    },
    {
      id: 'c3',
      width: ( 1 / 4 ),
      height: 1,
      // children: [
      //   {
      //     id: 'c3r1',
      //     width: 1,
      //     height: ( 1 / 4 ),
      //     children: [
      //       {
      //         id: 'c3r1c1',
      //         width: ( 1 / 2 ),
      //         height: 1
      //       },
      //       {
      //         id: 'c3r1c2',
      //         width: ( 1 / 2 ),
      //         height: 1
      //       },
      //     ]
      //   },
      //   {
      //     id: 'c3r2',
      //     width: 1,
      //     height: ( 3 / 4 ),
      //   }
      // ]
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
