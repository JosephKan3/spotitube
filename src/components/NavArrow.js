import "./NavArrow.css"
import React from "react"

class NavArrow extends React.Component {
    constructor(props) {
        super(props)

        this.renderArrow = this.renderArrow.bind(this)
    }
    renderArrow() {
        if (this.props.arrow === "up") {
            return <h6>&uarr;</h6>
        } else {
            return <h6>&darr;</h6>
        }
    }

    render() {
        return (
            <div>
                {this.renderArrow()}
            </div>
        )
    }
}

export default NavArrow;