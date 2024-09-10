"use client";

import FullPageSlides from "./components/Fullpage";

export default function Home() {
  return (
    <>
      <FullPageSlides />
      {/* <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-900">
        <Card className="p-10 bg-zinc-950 shadow-lg rounded-lg max-w-md w-full">
          <h1 className="text-3xl font-semibold text-center mb-6">
            Enter Peer Info
          </h1>
          <Card className="mb-6 bg-zinc-800">
            <CardBody className="text-center text-white w-full">
              Enter the host of the peer you want to connect to, and your
              nickname.
            </CardBody>
          </Card>
          <Input
            isClearable
            placeholder="127.0.0.1:3000"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            className="mb-4"
          />
          <Input
            isClearable
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4"
          />
          <Spacer y={1} />
          <Button onClick={handleNextPage} className="w-full bg-zinc-800">
            Connect
          </Button>
        </Card>
      </main> */}
    </>
  );
}
