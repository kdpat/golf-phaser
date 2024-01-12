defmodule GolfWeb.Plugs do
  import Plug.Conn
  
  def unique_session_id() do
    :crypto.strong_rand_bytes(16)
    |> Base.encode16()
  end
  
  def put_session_id(conn, _opts) do
    case get_session(conn, :session_id) do
      nil ->
        session_id = unique_session_id()
        
        conn
        |> put_session(:session_id, session_id)
        |> assign(:session_id, session_id)

      session_id ->
        assign(conn, :session_id, session_id)
    end
  end

  
end

