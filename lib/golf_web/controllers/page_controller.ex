defmodule GolfWeb.PageController do
  use GolfWeb, :controller

  def home(conn, _params) do
    IO.inspect(conn.assigns.session_id, label: "session id")
    IO.inspect(conn.assigns.user, label: "user")
    render(conn, :home)
  end
end
