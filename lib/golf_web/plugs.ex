defmodule GolfWeb.Plugs do
  import Plug.Conn
  
  def put_session_id(conn, _opts) do
    case get_session(conn, :session_id) do
      nil ->
        put_session(conn, :session_id, unique_session_id())

      _session_id ->
        conn
    end
  end

  defp unique_session_id() do
    :crypto.strong_rand_bytes(16)
    |> Base.encode16()
  end
end
