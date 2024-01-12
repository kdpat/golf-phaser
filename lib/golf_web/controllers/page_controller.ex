defmodule GolfWeb.PageController do
  use GolfWeb, :controller

  def home(conn, _params) do
    IO.inspect(get_session(conn, :session_id), label: "SESSION ID")
    render(conn, :home)
  end
end
